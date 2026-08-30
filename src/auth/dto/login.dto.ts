import { IsEmail, IsString, MinLength } from 'class-validator';

/** Body cho POST /api/auth/login */
export class LoginDto {
  @IsEmail({}, { message: 'email không đúng định dạng' })
  email!: string;

  /**
   * Chỉ kiểm tra tối thiểu ở bước đăng nhập.
   * Rule mạnh (chữ hoa, ký tự đặc biệt...) đặt ở RegisterDto —
   * lúc ĐẶT mật khẩu mới cần khắt khe; lúc đăng nhập thì mật khẩu
   * hoặc đúng hoặc sai, siết thêm chỉ làm rò rỉ thông tin.
   */
  @IsString({ message: 'password phải là chuỗi' })
  @MinLength(1, { message: 'password không được để trống' })
  password!: string;
}
