import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * 5 route CRUD chuẩn — đường dẫn thật có tiền tố /api (main.ts).
 *
 * ĐỔI SO VỚI BẢN CŨ: route liệt kê theo user từ `GET /categories/:userId`
 * chuyển thành `GET /categories?userId=1`.
 * Lý do: `/categories/:userId` và `/categories/:id` là CÙNG MỘT pattern URL —
 * Nest khớp theo thứ tự khai báo nên chỉ một trong hai chạy được. Id trên
 * đường dẫn phải là id của chính tài nguyên đó; điều kiện lọc thì để ở query.
 */
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** POST /api/categories */
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /**
   * GET /api/categories?userId=1
   *
   * Query param LUÔN là string ("1"), nên cần ParseIntPipe để service nhận
   * được number. `optional: true` cho phép bỏ trống param — thiếu nó thì
   * gọi /categories không kèm gì sẽ bị trả 400.
   */
  @Get()
  findAll(
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
  ) {
    return this.categoriesService.findAll(userId);
  }

  /** GET /api/categories/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  /** PATCH /api/categories/:id */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  /** DELETE /api/categories/:id — 204 vì xoá xong không còn gì để trả về */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
