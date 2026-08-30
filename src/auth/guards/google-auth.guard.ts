import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

/**
 * Giống JwtAuthGuard nhưng thêm một bước kiểm tra cấu hình.
 *
 * VÌ SAO CẦN: nếu .env thiếu GOOGLE_CLIENT_ID thì GoogleStrategy không
 * được đăng ký, và passport sẽ ném lỗi khó hiểu
 * "Unknown authentication strategy google" (HTTP 500).
 * Chặn sớm ở đây để báo đúng nguyên nhân cho người đang dựng dự án.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.config.get<string>('GOOGLE_CLIENT_ID')) {
      throw new ServiceUnavailableException(
        'Chưa bật đăng nhập Google: thiếu GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET trong .env',
      );
    }
    console.log('context', context);
    return super.canActivate(context);
  }
}
