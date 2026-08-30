import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

/**
 * ĐĂNG NHẬP GOOGLE — luồng OAuth 2.0 "Authorization Code".
 *
 *   1. Browser vào  GET /api/auth/google
 *      → strategy này chuyển hướng sang màn hình đồng ý của Google
 *   2. User chọn tài khoản, bấm "Cho phép"
 *   3. Google chuyển hướng ngược về  GET /api/auth/google/callback?code=...
 *   4. passport tự đổi `code` lấy access token + hồ sơ người dùng (bước
 *      này server-to-server, browser không thấy)
 *   5. validate() dưới đây chạy → ta có hồ sơ đã được Google xác nhận
 *
 * Điểm mấu chốt: mật khẩu Google KHÔNG BAO GIỜ đi qua server của mình.
 * Ta chỉ nhận lại lời chứng nhận "người này là ai" từ Google.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', ''),
      /**
       * PHẢI trùng TỪNG KÝ TỰ với "Authorized redirect URI" khai trong
       * Google Cloud Console, kể cả http/https và dấu / cuối.
       * Sai một ký tự → Google trả lỗi redirect_uri_mismatch.
       */
      callbackURL: config.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/api/auth/google/callback',
      ),
      // Xin đúng 2 quyền cần thiết. Xin thừa quyền làm user ngại bấm đồng ý.
      scope: ['email', 'profile'],
    });
  }

  /**
   * `done` là kiểu gọi lại của passport (có trước async/await).
   * Gọi done(null, user) = thành công → passport gán user vào request.user.
   * Gọi done(err) = thất bại → Nest trả 401.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    // Hiếm, nhưng tài khoản Google có thể không chia sẻ email
    // (ví dụ user gỡ quyền email) → không có gì để ánh xạ sang bảng users.
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(
        new UnauthorizedException(
          'Tài khoản Google này không chia sẻ email nên không đăng nhập được',
        ),
      );
      return;
    }

    try {
      const user = await this.authService.validateGoogleUser({
        googleId: profile.id,
        email,
        name: profile.displayName || email.split('@')[0],
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }
}
