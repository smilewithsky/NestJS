import { User } from '../entities/user.entity';

/**
 * NỘI DUNG BÊN TRONG JWT.
 *
 * Nhớ: JWT được KÝ chứ không được MÃ HOÁ — ai cầm token cũng đọc được
 * payload này (base64, dán vào jwt.io là thấy). Chữ ký chỉ đảm bảo
 * "không ai sửa được nội dung", KHÔNG đảm bảo bí mật.
 * → Tuyệt đối không nhét mật khẩu / dữ liệu nhạy cảm vào đây.
 *
 * `sub` (subject) là tên chuẩn của JWT cho "token này nói về ai".
 */
export interface JwtPayload {
  sub: number;
  email: string;
}

/** User đã lọc bỏ những field không được phép gửi ra ngoài. */
export type PublicUser = Omit<User, 'password' | 'categories'>;

/** Kết quả trả về cho client sau khi đăng nhập / đăng ký thành công. */
export interface AuthResult {
  accessToken: string;
  user: PublicUser;
}

/** Hồ sơ rút gọn lấy từ Google sau khi user bấm đồng ý. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
