import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

/**
 * PATCH /api/categories/:id — chỉ cho sửa `name` và `type`.
 *
 * OmitType(..., ['userId']) cắt bỏ userId TRƯỚC khi PartialType làm mọi field
 * optional. Nếu để nguyên, client có thể gửi { userId: 2 } và "sang tay"
 * category cho người khác — một lỗ hổng rất dễ lọt vì nó trông như
 * một field vô hại.
 *
 * Vì ValidationPipe bật `forbidNonWhitelisted: true`, gửi kèm userId lúc này
 * sẽ bị trả về 400 chứ không phải bị bỏ qua âm thầm.
 */
export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['userId'] as const),
) {}
