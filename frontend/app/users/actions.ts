'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/services/http';
import type { FormState } from '@/services/form-state';
import type { CreateUserInput } from '@/services/types';
import { usersApi } from '@/services/users';

/**
 * SERVER ACTIONS — hàm chạy TRÊN SERVER nhưng gọi được thẳng từ client.
 *
 * `'use server'` ở đầu file: Next biến mỗi export thành một endpoint ẩn.
 * Client Component import về chỉ nhận được một cái "tay cầm"; thân hàm
 * KHÔNG bao giờ được gửi xuống trình duyệt — nên gọi usersApi (server-only)
 * ở đây là hợp lệ.
 *
 * ⚠️ Hệ quả bảo mật: endpoint đó CÔNG KHAI. Mọi thứ validate ở form phía
 * client chỉ là trải nghiệm; ai cũng có thể gọi thẳng action với dữ liệu bất
 * kỳ. Lớp chặn thật vẫn là ValidationPipe bên NestJS.
 */

/** Đọc 1 field text từ FormData. Trả '' nếu thiếu — không bao giờ trả null. */
function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

/** Gom mọi loại lỗi về một FormState để form hiển thị. */
function toErrorState(error: unknown): FormState {
  // ApiError mang theo message do NestJS soạn (409 trùng email,
  // 400 kèm danh sách lỗi validate...) — hiển thị nguyên văn là tốt nhất.
  if (error instanceof ApiError) {
    return { status: 'error', message: error.message };
  }
  // Lỗi ngoài dự kiến: không ném tiếp, vì ném ra khỏi Server Action sẽ
  // hiện màn hình lỗi đỏ của Next và người dùng mất luôn dữ liệu đang gõ.
  return { status: 'error', message: 'Có lỗi không xác định xảy ra.' };
}

/**
 * Tạo mới HOẶC cập nhật, tuỳ vào field ẩn `id` có giá trị hay không.
 *
 * Dùng CHUNG một action cho cả hai vì form là một: gộp lại thì không phải
 * đồng bộ hai bản sao logic đọc FormData mỗi lần thêm field mới.
 *
 * Chữ ký (prevState, formData) là bắt buộc để dùng với useActionState.
 * prevState không cần tới ở đây, nhưng vẫn phải khai đúng vị trí tham số.
 */
export async function saveUser(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = text(formData, 'id');
  const name = text(formData, 'name');
  const email = text(formData, 'email');
  const ageRaw = text(formData, 'age');

  // Input rỗng cho ra '' chứ không phải undefined. Gửi thẳng age: ''
  // lên BE sẽ bị @IsInt chặn — nên phải quy về undefined để BE hiểu là
  // "không khai báo" (@IsOptional bỏ qua).
  const age = ageRaw === '' ? undefined : Number(ageRaw);

  if (age !== undefined && Number.isNaN(age)) {
    return { status: 'error', message: 'Tuổi phải là số.' };
  }

  const input: CreateUserInput = { name, email, age };

  try {
    if (id) {
      await usersApi.update(Number(id), input);
    } else {
      await usersApi.create(input);
    }
  } catch (error) {
    return toErrorState(error);
  }

  // Trang /users là Server Component có `cache: 'no-store'`, nhưng Next vẫn
  // giữ Router Cache ở phía client. Không gọi revalidatePath thì bảng vẫn là
  // dữ liệu cũ cho tới khi người dùng F5.
  revalidatePath('/users');

  return {
    status: 'ok',
    message: id ? `Đã cập nhật ${name}.` : `Đã thêm ${name}.`,
  };
}

/**
 * Xoá user.
 *
 * Nhận `id: number` chứ không phải FormData vì nút Xoá không phải một form
 * có nhiều field — chỉ cần đúng một giá trị.
 */
export async function deleteUser(id: number): Promise<FormState> {
  try {
    await usersApi.remove(id);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath('/users');
  // Category có `onDelete: 'CASCADE'` trỏ về user → xoá user là xoá luôn
  // toàn bộ category của họ. Làm mới cả trang kia cho khỏi hiển thị dữ liệu ma.
  revalidatePath('/categories');

  return { status: 'ok', message: `Đã xoá user #${id}.` };
}
