/**
 * Kiểu kết quả CHUNG mà mọi Server Action trong app trả về.
 *
 * File này CỐ TÌNH không có `import 'server-only'`: nó được cả Server Action
 * lẫn Client Component dùng chung. An toàn, vì ở đây chỉ có kiểu và hằng số —
 * không URL nội bộ, không token, không logic gọi API.
 *
 * VÌ SAO ACTION TRẢ VỀ OBJECT THAY VÌ NÉM LỖI:
 *   Server Action ném exception trong môi trường production sẽ bị Next che
 *   thành "An unexpected error occurred" để không lộ chi tiết server ra ngoài.
 *   Lỗi nghiệp vụ (trùng email, sai định dạng...) là thứ NGƯỜI DÙNG cần đọc,
 *   nên phải trả về như dữ liệu bình thường.
 */
export interface FormState {
  status: 'idle' | 'ok' | 'error';
  message: string;
}

/** Giá trị khởi tạo cho useActionState — chưa submit lần nào. */
export const IDLE: FormState = { status: 'idle', message: '' };
