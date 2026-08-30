'use server';

import { revalidatePath } from 'next/cache';
import type { FormState } from '@/services/form-state';
import { ApiError } from '@/services/http';
import { transectionsApi } from '@/services/transections';

/** Đọc 1 field text từ FormData. Trả '' nếu thiếu. */
function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function toErrorState(error: unknown): FormState {
  if (error instanceof ApiError) {
    return { status: 'error', message: error.message };
  }
  return { status: 'error', message: 'Có lỗi không xác định xảy ra.' };
}

/**
 * <input type="number"> vẫn gửi lên STRING, và có thể rỗng.
 * Number('') = 0 — nên phải chặn chuỗi rỗng TRƯỚC khi ép kiểu, không thì
 * bỏ trống ô số tiền sẽ lặng lẽ thành giao dịch 0đ.
 *
 * BE khai `@IsInt()` cho amount nên số lẻ (12.5) sẽ bị trả 400; kiểm luôn
 * ở đây để người dùng thấy lỗi ngay thay vì phải chờ một vòng mạng.
 */
function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

/** Tạo mới nếu field ẩn `id` rỗng, ngược lại thì cập nhật. */
export async function saveTransection(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = text(formData, 'id');
  const description = text(formData, 'description');
  const categoryId = Number(text(formData, 'categoryId'));

  const amount = parseAmount(text(formData, 'amount'));
  if (amount === null) {
    return { status: 'error', message: 'Số tiền phải là số nguyên.' };
  }

  if (!id && !categoryId) {
    return { status: 'error', message: 'Hãy chọn category cho giao dịch này.' };
  }

  try {
    if (id) {
      // PATCH KHÔNG gửi categoryId: UpdateTransectionDto bên BE chỉ nhận
      // amount và description, gửi thừa sẽ bị forbidNonWhitelisted trả 400.
      await transectionsApi.update(Number(id), { amount, description });
    } else {
      await transectionsApi.create({ amount, description, categoryId });
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath('/transections');

  return {
    status: 'ok',
    message: id ? `Đã cập nhật giao dịch #${id}.` : 'Đã thêm giao dịch mới.',
  };
}

export async function deleteTransection(id: number): Promise<FormState> {
  try {
    await transectionsApi.remove(id);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath('/transections');

  return { status: 'ok', message: `Đã xoá giao dịch #${id}.` };
}
