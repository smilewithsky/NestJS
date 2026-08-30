/**
 * Các kiểu dữ liệu MIRROR lại entity/DTO bên NestJS.
 *
 * Vì FE và BE là 2 project riêng, TypeScript KHÔNG tự biết API trả về gì —
 * `res.json()` luôn ra `any`. Khai báo kiểu ở đây để:
 *   - có gợi ý code + bắt lỗi khi đổi tên field
 *   - có 1 chỗ duy nhất phải sửa khi BE đổi shape
 *
 * Lưu ý: đây chỉ là LỜI HỨA, không phải kiểm chứng lúc chạy.
 * Nếu muốn chắc chắn 100% thì phải validate runtime (zod...) — chưa cần ở mốc này.
 */

/** Khớp với src/common/enum.ts bên NestJS */
export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

/** Khớp với src/entities/user.entity.ts */
export interface User {
  id: number;
  name: string;
  email: string;
  /** Cột nullable bên DB → có thể là null, hoặc vắng mặt */
  age?: number | null;
  /**
   * JSON không có kiểu Date. TypeORM trả Date, nhưng qua JSON.stringify
   * nó thành chuỗi ISO ("2026-08-09T03:00:00.000Z") → phía FE là string.
   * Đây là cái bẫy hay gặp: đừng gọi .getFullYear() thẳng lên field này.
   */
  createdAt: string;
  updatedAt: string;
}

/** Khớp với src/entities/categories.entity.ts */
export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}

/** Body cho POST /api/users */
export interface CreateUserInput {
  name: string;
  email: string;
  age?: number;
}

/** Body cho PATCH /api/users/:id — mọi field optional (PartialType bên BE) */
export type UpdateUserInput = Partial<CreateUserInput>;

/** Body cho POST /api/categories */
export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
}
