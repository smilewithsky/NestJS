import 'server-only';

import { getSessionToken } from './session';

/**
 * LỚP GỌI HTTP — chỗ DUY NHẤT trong FE biết địa chỉ backend.
 *
 * `import 'server-only'` ở trên là một cái chốt: nếu lỡ tay import file này
 * vào một component có 'use client', build sẽ FAIL ngay thay vì lặng lẽ
 * đẩy URL nội bộ + token xuống trình duyệt.
 *
 * Vì mọi request đều xuất phát từ server của Next (không phải từ browser),
 * ta KHÔNG dính CORS. Trình duyệt chỉ nói chuyện với Next; Next nói chuyện với Nest.
 *
 *   Browser ──► Next.js (localhost:3001) ──► NestJS (localhost:3000/api) ──► Postgres
 */
export const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://localhost:3000/api';

/**
 * Bản URL mà TRÌNH DUYỆT gọi thẳng được.
 *
 * Gần như mọi thứ đi qua server Next, nhưng đăng nhập Google là ngoại lệ:
 * đó là chuỗi chuyển hướng thật của trình duyệt (Next → Nest → Google →
 * Nest → Next), nên link phải là địa chỉ mà máy người dùng phân giải được.
 * Vì vậy biến này có tiền tố NEXT_PUBLIC_ và ĐƯỢC PHÉP lộ ra ngoài.
 */
export const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? API_BASE_URL;

/**
 * Lỗi có mang theo HTTP status, để tầng trên phân biệt được
 * 401 (chưa đăng nhập) với 409 (trùng email) với 500 (BE sập).
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
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(' • ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export interface RequestOptions extends RequestInit {
  /**
   * Mặc định mọi request tự đính kèm `Authorization: Bearer <token>` nếu
   * đang có phiên đăng nhập. Đặt true cho các route công khai
   * (login/register) — gửi token cũ vào đó là thừa và dễ gây nhầm lẫn.
   */
  skipAuth?: boolean;
}

export async function request<T>(
  path: string,
  { skipAuth, ...init }: RequestOptions = {},
): Promise<T> {
  const token = skipAuth ? null : await getSessionToken();

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        // Chỉ thêm header khi thực sự có token — gửi "Bearer null" thì BE
        // sẽ hiểu là token hỏng và trả 401 thay vì coi như khách vãng lai.
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
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
