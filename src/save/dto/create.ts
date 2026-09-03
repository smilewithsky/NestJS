import { IsInt, IsString } from "class-validator";

export class CreateSaveDto {
  @IsString({ message: "name phải là chuỗi" })
  name!: string;
  @IsString({ message: "description phải là chuỗi" })
  description!: string;
  @IsInt({ message: "amount phải là số nguyên" })
  amount!: number;
}
