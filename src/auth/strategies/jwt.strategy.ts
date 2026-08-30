import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../entities/user.entity';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../auth.types';

/**
 * STRATEGY = "cách kiểm tra một request có được vào hay không".
 * Passport định nghĩa nhiều cách (local, jwt, google, facebook...);
 * đây là cách "đọc JWT từ header Authorization".
 *
 * PassportStrategy(Strategy, 'jwt') sinh ra một class cơ sở đã nối sẵn
 * passport vào DI của Nest. Tên 'jwt' chính là tên dùng ở AuthGuard('jwt').
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Lấy token từ header: `Authorization: Bearer <token>`
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // false = token hết hạn thì từ chối. Đừng bao giờ để true.
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret-hay-doi-di'),
    });
  }

  /**
   * Chỉ chạy KHI chữ ký hợp lệ và token còn hạn — nên ở đây không cần
   * kiểm tra token nữa, chỉ cần biến payload thành user thật.
   *
   * Giá trị trả về được passport gán vào `request.user`.
   *
   * VÌ SAO PHẢI VÀO DB thay vì tin luôn payload? Vì token sống 7 ngày:
   * trong thời gian đó user có thể đã bị xoá hoặc đổi email. Đọc DB
   * đảm bảo dữ liệu luôn tươi (đánh đổi: mỗi request tốn 1 query).
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findByIdOrNull(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Tài khoản không còn tồn tại');
    }
    return user;
  }
}
