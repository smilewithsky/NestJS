import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CategoryType } from '../../common/enum';

export class CreateCategoryDto {
  /**
   * Chủ sở hữu của category.
   *
   * Trước đây controller hardcode `createCategory(1, ...)` — mọi category
   * đều rơi vào user id 1. Đưa userId lên body để FE chọn được đúng người.
   *
   * Đây là giải pháp TẠM: tới Mốc 5 (auth) thì field này phải BỎ ĐI và lấy
   * từ token qua @CurrentUser(), vì client tự khai mình là ai thì
   * user A sửa được dữ liệu của user B.
   */
  @IsInt({ message: 'userId phải là số nguyên' })
  @Min(1)
  userId!: number;

  @IsString({ message: 'name phải là chuỗi' })
  @IsNotEmpty({ message: 'name không được để trống' })
  @MaxLength(100)
  name!: string;

  /**
   * @IsEnum kiểm tra GIÁ TRỊ gửi lên có nằm trong enum không.
   * Cột DB cũng khai `type: 'enum'` — hai lớp chặn ở hai tầng khác nhau:
   * lớp này trả 400 kèm message đọc được, lớp DB là chốt cuối.
   */
  @IsEnum(CategoryType, { message: "type phải là 'income' hoặc 'expense'" })
  type!: CategoryType;
}
