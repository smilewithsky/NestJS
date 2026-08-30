import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Body cho POST /api/auth/register */
export class RegisterDto {
  @IsString({ message: 'name phải là chuỗi' })
  @IsNotEmpty({ message: 'name không được để trống' })
  @MaxLength(100)
  name!: string;

  @IsEmail({}, { message: 'email không đúng định dạng' })
  email!: string;

  @IsString({ message: 'password phải là chuỗi' })
  @MinLength(6, { message: 'password phải có ít nhất 6 ký tự' })
  @MaxLength(72, {
    message: 'password tối đa 72 ký tự',
  })
  password!: string;

  @IsOptional()
  @IsInt({ message: 'age phải là số nguyên' })
  @Min(0)
  @Max(150)
  age?: number;
}
