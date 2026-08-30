import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // Cho AuthService dùng lại các truy vấn bảng users
    // (nhờ UsersModule đã `exports: [UsersService]`).
    UsersModule,

    PassportModule,

    /**
     * registerAsync vì secret nằm trong .env, phải chờ ConfigService
     * sẵn sàng — cùng lý do với TypeOrmModule.forRootAsync ở app.module.
     *
     * secret là thứ duy nhất ngăn người khác TỰ KÝ token giả.
     * Lộ secret = ai cũng đăng nhập được bằng bất kỳ tài khoản nào.
     */
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-hay-doi-di'),
        signOptions: {
          // Hạn của token. Ngắn thì an toàn hơn nhưng user phải đăng nhập lại
          // thường xuyên. Hệ thống thật giải bài này bằng refresh token.
          //
          // Cần `as` vì @nestjs/jwt khai báo expiresIn là kiểu literal hẹp
          // ('7d' | '2h' | số giây...), còn ConfigService chỉ trả string chung.
          // Giá trị thật vẫn phải hợp lệ — sai cú pháp là lỗi lúc chạy.
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '7d',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),

    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,

    /**
     * GoogleStrategy chỉ đăng ký KHI có cấu hình.
     *
     * Constructor của passport-google-oauth20 ném lỗi ngay nếu thiếu
     * clientID — mà đó là lúc Nest đang khởi động, nên cả app sẽ không
     * chạy được. Với useFactory dưới đây, ai chưa xin key Google vẫn dùng
     * được đăng nhập bằng email/mật khẩu như thường.
     *
     * PHẢI hỏi ConfigService chứ KHÔNG đọc thẳng process.env ở đây:
     * metadata của @Module được đánh giá lúc file này được import, tức là
     * TRƯỚC khi ConfigModule.forRoot() ở app.module nạp .env vào process.env
     * → đọc thẳng sẽ luôn thấy undefined và strategy không bao giờ đăng ký.
     * useFactory thì chạy muộn hơn, lúc DI đã tạo xong ConfigService.
     */
    {
      provide: GoogleStrategy,
      inject: [ConfigService, AuthService],
      useFactory: (config: ConfigService, authService: AuthService) =>
        config.get<string>('GOOGLE_CLIENT_ID')
          ? new GoogleStrategy(config, authService)
          : null,
    },
  ],
})
export class AuthModule {}
