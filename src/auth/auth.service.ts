import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResult, GoogleProfile, PublicUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * AUTHSERVICE — nơi trả lời đúng 2 câu hỏi:
 *   1. "Người này có đúng là họ không?"  (xác thực)
 *   2. "Cấp cho họ tấm vé nào?"          (ký JWT)
 *
 * Giống mọi service khác trong dự án: KHÔNG biết gì về HTTP,
 * không đụng tới req/res/cookie. Nó chỉ ném exception, Nest lo dịch
 * sang status code.
 */
@Injectable()
export class AuthService {
  /**
   * COST của bcrypt: 10 → thuật toán chạy 2^10 vòng.
   * Số càng cao càng khó bị dò mật khẩu, nhưng đăng nhập cũng chậm đi.
   * 10–12 là khoảng cân bằng thường dùng.
   */
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** POST /api/auth/register */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existed = await this.usersService.findByEmail(dto.email);
    if (existed) {
      throw new ConflictException(`Email ${dto.email} đã được sử dụng`);
    }

    const user = await this.usersService.createAccount({
      name: dto.name,
      email: dto.email,
      age: dto.age ?? null,
      password: await bcrypt.hash(dto.password, AuthService.BCRYPT_ROUNDS),
    });

    return this.issueToken(user);
  }

  /** POST /api/auth/login */
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    /*
     * CÙNG MỘT THÔNG BÁO cho cả 3 trường hợp: email không tồn tại,
     * tài khoản chỉ có Google (chưa đặt mật khẩu), và sai mật khẩu.
     *
     * Nếu tách ra ("email không tồn tại" / "sai mật khẩu") thì kẻ tấn công
     * có thể dùng chính form đăng nhập để dò xem email nào đã đăng ký.
     */
    const invalid = new UnauthorizedException('Email hoặc mật khẩu không đúng');

    if (!user?.password) throw invalid;

    const matched = await bcrypt.compare(dto.password, user.password);
    if (!matched) throw invalid;

    return this.issueToken(user);
  }

  /**
   * Được GoogleStrategy gọi sau khi Google xác nhận danh tính người dùng.
   * Tới đây danh tính đã CHẮC CHẮN đúng (Google bảo đảm), việc còn lại
   * chỉ là ánh xạ hồ sơ Google sang một dòng trong bảng users.
   *
   * 3 tình huống, xử lý theo đúng thứ tự:
   *   1. Đã từng đăng nhập Google → tìm thấy theo googleId, dùng luôn.
   *   2. Email đó đã có tài khoản mật khẩu → LIÊN KẾT (gắn googleId vào
   *      user cũ) thay vì tạo user thứ hai. Không có bước này, một người
   *      sẽ có 2 tài khoản với cùng email — mà cột email lại UNIQUE
   *      nên thực tế sẽ vỡ ở tầng DB.
   *   3. Hoàn toàn mới → tạo user, password để null.
   */
  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    const byGoogleId = await this.usersService.findByGoogleId(profile.googleId);
    if (byGoogleId) return byGoogleId;

    const byEmail = await this.usersService.findByEmail(profile.email);
    if (byEmail) {
      byEmail.googleId = profile.googleId;
      byEmail.avatarUrl = byEmail.avatarUrl ?? profile.avatarUrl ?? null;
      return this.usersService.persist(byEmail);
    }

    return this.usersService.createAccount({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl ?? null,
      // password để null: tài khoản này chỉ đăng nhập được bằng Google
      password: null,
      age: null,
    });
  }

  /** Ký JWT cho một user đã được xác thực xong. */
  issueToken(user: User): AuthResult {
    return {
      // payload phải khớp interface JwtPayload — JwtStrategy sẽ đọc lại nó
      accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
      user: AuthService.toPublicUser(user),
    };
  }

  /**
   * Bỏ những field không được ra khỏi server.
   *
   * `password` bình thường đã bị chặn bởi `select: false` trong entity,
   * NHƯNG đường login có addSelect('user.password') nên nó thực sự có mặt
   * trong object — thiếu hàm này là hash rơi thẳng vào response JSON.
   */
  static toPublicUser(user: User): PublicUser {
    const { password: _password, categories: _categories, ...rest } = user;
    return rest;
  }
}
