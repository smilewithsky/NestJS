import 'server-only';

/**
 * ⚠️ FILE NÀY ĐÃ CŨ — không còn chỗ nào import nữa.
 *
 * Bản đang dùng là services/http.ts + services/users.ts + services/categories.ts
 * (có kèm token đăng nhập). Ngoài ra `categoriesApi.listByUser` bên dưới trỏ
 * vào route `GET /categories/:userId` mà backend đã bỏ — route đó giờ là
 * `GET /categories/:id`, gọi vào sẽ trả nhầm dữ liệu.
 *
 * Cứ xoá cả thư mục lib/ khi bạn thấy sẵn sàng.
 */

import type {
  Category,
  CreateCategoryInput,
  CreateUserInput,
  UpdateUserInput,
  User,
} from './types';

/**
 * LỚP GỌI API — chỗ DUY NHẤT trong FE biết địa chỉ backend.
 *
 * `import 'server-only'` ở trên là một cái chốt: nếu lỡ tay import file này
 * vào một component có 'use client', build sẽ FAIL ngay thay vì lặng lẽ
 * đẩy URL nội bộ + logic gọi API xuống trình duyệt.
 *
 * Vì mọi request đều xuất phát từ server của Next (không phải từ browser),
 * ta KHÔNG dính CORS. Trình duyệt chỉ nói chuyện với Next; Next nói chuyện với Nest.
 *
 *   Browser ──► Next.js (localhost:3001) ──► NestJS (localhost:3000/api) ──► Postgres
 */
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api';

/**
 * Lỗi có mang theo HTTP status, để tầng trên phân biệt được
 * 404 (không tìm thấy) với 409 (trùng email) với 500 (BE sập).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Nest trả lỗi theo shape cố định:
 *   { statusCode: 409, message: "Email x đã được sử dụng", error: "Conflict" }
 * Riêng lỗi validate của ValidationPipe thì `message` là MẢNG string:
 *   { statusCode: 400, message: ["email không đúng định dạng"], error: "Bad Request" }
 * Hàm này gom cả 2 trường hợp về 1 chuỗi để hiển thị.
 */
function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body;
    if (Array.isArray(message)) return message.join(' • ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      // Dữ liệu chi tiêu thay đổi liên tục → không cache.
      // Bỏ dòng này thì Next có thể trả lại kết quả cũ sau khi bạn vừa thêm mới.
      cache: 'no-store',
    });
  } catch {
    // fetch chỉ ném lỗi khi KHÔNG kết nối được (BE chưa chạy, sai port...).
    // Response 404/500 vẫn là "thành công" với fetch — xử lý ở dưới.
    throw new ApiError(
      0,
      `Không kết nối được tới API tại ${API_BASE_URL}. Backend NestJS đã chạy chưa?`,
    );
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // BE trả HTML hoặc rỗng — bỏ qua, dùng message mặc định
    }
    throw new ApiError(res.status, extractMessage(body, `HTTP ${res.status}`));
  }

  // DELETE /api/users/:id trả 204 No Content → body rỗng,
  // gọi res.json() sẽ ném "Unexpected end of JSON input".
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

/* ─────────────────────────── USERS ─────────────────────────── */

export const usersApi = {
  list: () => request<User[]>('/users'),

  getOne: (id: number) => request<User>(`/users/${id}`),

  create: (input: CreateUserInput) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateUserInput) =>
    request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

/* ───────────────────────── CATEGORIES ──────────────────────── */

export const categoriesApi = {
  /** GET /api/categories/:userId */
  listByUser: (userId: number) => request<Category[]>(`/categories/${userId}`),

  /**
   * POST /api/categories
   * LƯU Ý: controller bên BE đang hardcode userId = 1
   * (`this.categoriesService.createCategory(1, ...)`), nên category mới
   * LUÔN thuộc về user id 1 dù bạn đang xem user nào. Sẽ hết khi làm Mốc 5 (auth).
   */
  create: (input: CreateCategoryInput) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
