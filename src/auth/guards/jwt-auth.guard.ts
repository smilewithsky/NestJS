import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * GUARD = người gác cửa, chạy TRƯỚC controller. Trả true → cho vào,
 * ném exception → chặn lại (401).
 *
 * AuthGuard('jwt') đã làm sẵn mọi việc; bọc lại thành class riêng để:
 *   - chỗ dùng viết @UseGuards(JwtAuthGuard) — đọc rõ nghĩa hơn chuỗi 'jwt'
 *   - sau này muốn thêm logic (bỏ qua route public...) chỉ sửa 1 file
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
