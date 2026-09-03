import { IsInt, IsString } from "class-validator";

export class CreateTransectionDto {
  @IsInt({ message: "amount phải là số nguyên" })
  amount!: number;
  @IsString({ message: "description phải là chuỗi" })
  description!: string;
  @IsInt({ message: "categoryId phải là số nguyên" })
  categoryId!: number;
}
