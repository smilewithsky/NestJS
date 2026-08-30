import { IsInt, IsString } from 'class-validator';

export class UpdateTransectionDto {
  id!: number;
  @IsInt({ message: 'amount phải là số nguyên' })
  amount!: number;
  @IsString({ message: 'description phải là chuỗi' })
  description?: string;
}
