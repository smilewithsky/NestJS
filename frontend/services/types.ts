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
  INCOME = "income",
  EXPENSE = "expense",
}

/**
 * Khớp với src/entities/user.entity.ts — nhưng KHÔNG có `password`.
 * Bên BE, cột password khai báo `select: false` và AuthService còn lọc lại
 * một lần nữa qua toPublicUser(), nên hash không bao giờ ra tới đây.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  /** Cột nullable bên DB → có thể là null, hoặc vắng mặt */
  age?: number | null;
  /** Có giá trị khi tài khoản đã liên kết Google */
  googleId?: string | null;
  avatarUrl?: string | null;
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
  /**
   * Chỉ có mặt khi BE join quan hệ (`relations: { user: true }`).
   * GET /api/categories có join; các route khác thì tuỳ — nên để optional
   * thay vì bắt buộc, để TypeScript nhắc mình kiểm tra trước khi đọc.
   */
  user?: User;
  createdAt: string;
  updatedAt: string;
}

/* ─────────────────────────── AUTH ─────────────────────────── */

/** Body cho POST /api/auth/login */
export interface LoginInput {
  email: string;
  password: string;
}

/** Body cho POST /api/auth/register */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  age?: number;
}

/** Response của /api/auth/login và /api/auth/register */
export interface AuthResult {
  accessToken: string;
  user: User;
}

/* ─────────────────────────── USERS ─────────────────────────── */

/** Body cho POST /api/users */
export interface CreateUserInput {
  name: string;
  email: string;
  age?: number;
}

/** Body cho PATCH /api/users/:id — mọi field optional (PartialType bên BE) */
export type UpdateUserInput = Partial<CreateUserInput>;

/* ───────────────────────── CATEGORIES ──────────────────────── */

/** Body cho POST /api/categories */
export interface CreateCategoryInput {
  /** Chủ sở hữu. Sẽ bỏ đi khi BE lấy user từ token (Mốc 5). */
  userId: number;
  name: string;
  type: CategoryType;
}

/**
 * Body cho PATCH /api/categories/:id.
 * KHÔNG có userId: BE dùng OmitType để chặn việc đổi chủ sở hữu,
 * và `forbidNonWhitelisted` sẽ trả 400 nếu lỡ gửi kèm.
 */
export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, "userId">>;

/* ──────────────────────── TRANSECTIONS ─────────────────────── */

/** Khớp với src/entities/transection.entity.ts */
export interface Transection {
  id: number;
  /**
   * Bên BE là `decimal(10,2)`. Driver `pg` trả decimal về dạng CHUỖI
   * ("50000.00") chứ không phải number — vì kiểu number của JS không biểu
   * diễn chính xác được số thập phân, mà tiền thì không được sai số.
   *
   * Hệ quả: đừng cộng thẳng `a.amount + b.amount` (sẽ ra "1020" nối chuỗi).
   * Muốn tính toán thì Number(t.amount) trước.
   */
  amount: string;
  description: string;
  /**
   * Chỉ có mặt khi BE join quan hệ (`relations: { category: true }`).
   * findAll/findOne bên transections.service.ts có join; các route khác
   * thì chưa chắc — để optional cho TypeScript nhắc mình kiểm tra trước khi đọc.
   */
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

/** Body cho POST /api/transections */
export interface CreateTransectionInput {
  amount: number;
  description: string;
  /** Giao dịch thuộc category nào. BE nhận id, không nhận cả object. */
  categoryId: number;
}

/**
 * Body cho PATCH /api/transections/:id.
 *
 * KHÔNG có `categoryId`: UpdateTransectionDto bên BE hiện chỉ cho sửa
 * amount và description. Nếu sau này muốn cho phép đổi category của một
 * giao dịch thì phải mở ở DTO bên BE trước, sửa mỗi chỗ này không đủ.
 */
export type UpdateTransectionInput = Partial<
  Pick<CreateTransectionInput, "amount" | "description">
>;
