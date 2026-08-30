import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../../entities/user.entity';

/**
 * @CurrentUser() — decorator tham số tự viết.
 *
 * Sau khi JwtAuthGuard chạy xong, passport đã gán user vào request.user.
 * Thay vì mỗi controller phải viết `@Req() req` rồi `req.user as User`
 * (mất kiểu, dính vào Express), ta gói lại một lần ở đây:
 *
 *   me(@CurrentUser() user: User) { ... }
 *
 * CHỈ dùng được trên route CÓ guard — không guard thì request.user
 * là undefined.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    return ctx.switchToHttp().getRequest<{ user: User }>().user;
  },
);
