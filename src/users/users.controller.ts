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
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

/**
 * CONTROLLER = cửa ra vào HTTP. Chỉ làm 3 việc:
 *   1. nhận request  2. gọi service  3. trả kết quả
 * KHÔNG viết logic nghiệp vụ ở đây.
 *
 * @Controller('users') → tiền tố route cho cả class.
 * main.ts còn gọi app.setGlobalPrefix('api'), nên đường dẫn thật là:
 *   /api/users
 *
 * Bạn KHÔNG cần res.json() hay res.status() như Express:
 * trả về gì thì Nest tự serialize thành JSON, status mặc định
 * 200 cho GET/PATCH/DELETE và 201 cho POST.
 */
@Controller("users")
export class UsersController {
  // DEPENDENCY INJECTION: chỉ cần khai báo, KHÔNG tự new UsersService().
  // Nest thấy kiểu UsersService → tự tìm provider tương ứng và tiêm vào.
  // Nhờ vậy lúc viết test bạn thay bằng service giả cực dễ.
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /api/users
   * @Body() lấy body của request. Vì tham số có kiểu CreateUserDto,
   * ValidationPipe toàn cục sẽ validate nó trước khi hàm này chạy.
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /** GET /api/users */
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * GET /api/users/:id
   * @Param('id') lấy tham số trên URL — nhưng nó LUÔN là string ("1").
   * ParseIntPipe chuyển "1" → 1, và tự trả 400 nếu client gửi "abc".
   * → nhờ nó, service luôn nhận được number sạch.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  /** PATCH /api/users/:id */
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * DELETE /api/users/:id
   * @HttpCode(204) → đổi status mặc định thành 204 No Content,
   * vì xoá xong thì không có gì để trả về.
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
