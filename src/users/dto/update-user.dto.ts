import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * PartialType(CreateUserDto) = lấy y nguyên CreateUserDto
 * nhưng biến MỌI field thành optional, và giữ lại toàn bộ rule validate.
 *
 * TẠI SAO CẦN DTO RIÊNG CHO UPDATE?
 *   PATCH /users/1 { "age": 30 } — client chỉ muốn sửa 1 field.
 *   Nếu dùng CreateUserDto thì ValidationPipe sẽ đòi cả name và email.
 *
 * Nhờ PartialType, bạn không phải copy-paste lại các @IsEmail, @MaxLength...
 * (package @nestjs/mapped-types đã có trong dependencies)
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
