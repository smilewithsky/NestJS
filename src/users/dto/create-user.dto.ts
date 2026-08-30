import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'name phải là chuỗi' })
  @IsNotEmpty({ message: 'name không được để trống' })
  @MaxLength(100)
  name!: string;

  @IsEmail({}, { message: 'email không đúng định dạng' })
  email?: string;

  /**
   * @IsOptional() → cho phép KHÔNG gửi field này.
   * Nếu có gửi thì mới kiểm tra tiếp các rule bên dưới.
   */
  @IsOptional()
  @IsInt({ message: 'age phải là số nguyên' })
  @Min(0)
  @Max(150)
  age?: number;
}
