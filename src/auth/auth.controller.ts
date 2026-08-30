import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
/**
 * `import type` (không phải import thường) là BẮT BUỘC với kiểu được dùng
 * trong chữ ký hàm có decorator: tsconfig bật isolatedModules +
 * emitDecoratorMetadata, TypeScript sẽ báo TS1272 nếu import kiểu bình thường.
 */
import type { AuthResult, PublicUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** POST /api/auth/register — tạo tài khoản mật khẩu, trả luôn token */
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   *
   * @HttpCode(200): POST mặc định trả 201 Created, nhưng đăng nhập
   * không TẠO ra tài nguyên nào cả → 200 OK đúng nghĩa hơn.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  /**
   * GET /api/auth/me — "tôi là ai?"
   * Route đầu tiên trong dự án được bảo vệ: không có
   * `Authorization: Bearer <token>` hợp lệ thì dừng ở guard, trả 401.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User): PublicUser {
    return AuthService.toPublicUser(user);
  }

  /**
   * GET /api/auth/google — điểm bắt đầu luồng Google.
   *
   * Thân hàm CỐ TÌNH để trống: guard đã chuyển hướng browser sang Google
   * trước khi tới đây, nên code trong này không bao giờ chạy.
   * Route tồn tại chỉ để có một URL cho nút "Đăng nhập với Google".
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {}

  /**
   * GET /api/auth/google/callback — Google gọi ngược về đây.
   *
   * Guard đã xác thực xong và gắn user vào request. Việc còn lại là ký
   * token rồi ĐẨY NGƯỢC người dùng về frontend — vì đây là điều hướng
   * của trình duyệt (không phải fetch), trả JSON ở đây thì user sẽ nhìn
   * thấy một trang JSON trần trụi.
   *
   * ĐÁNH ĐỔI: token đi qua query string, nên nó nằm lại trong lịch sử
   * duyệt web và log của server. Chấp nhận được vì phía Next đọc token
   * ngay ở route handler /auth/callback rồi CHUYỂN HƯỚNG TIẾP — URL chứa
   * token không bao giờ được render thành trang. Hệ thống thật thường
   * thay bằng "mã đổi token" dùng một lần.
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@CurrentUser() user: User, @Res() res: Response): void {
    const { accessToken } = this.authService.issueToken(user);
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );

    res.redirect(
      `${frontendUrl}/auth/callback?token=${encodeURIComponent(accessToken)}`,
    );
  }
}
