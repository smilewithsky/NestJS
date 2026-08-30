'use server';

import { revalidatePath } from 'next/cache';
import { categoriesApi } from '@/services/categories';
import type { FormState } from '@/services/form-state';
import { ApiError } from '@/services/http';
import { CategoryType } from '@/services/types';

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
 * <select> trả về string tự do — TypeScript tin đó là CategoryType chỉ vì
 * ta ép kiểu thì đến khi ai đó gọi thẳng action với type: "abc", giá trị
 * rác sẽ đi tới tận DB.
 *
 * Kiểm tra ngay tại cửa, và dùng type predicate để TypeScript thu hẹp kiểu
 * ở phần code phía sau thay vì phải `as CategoryType`.
 */
function isCategoryType(value: string): value is CategoryType {
  return (Object.values(CategoryType) as string[]).includes(value);
}

/** Tạo mới nếu field ẩn `id` rỗng, ngược lại thì cập nhật. */
export async function saveCategory(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = text(formData, 'id');
  const userId = Number(text(formData, 'userId'));
  const name = text(formData, 'name');
  const type = text(formData, 'type');

  if (!isCategoryType(type)) {
    return { status: 'error', message: 'Loại category không hợp lệ.' };
  }

  if (!id && !userId) {
    return { status: 'error', message: 'Hãy chọn user sở hữu category này.' };
  }

  try {
    if (id) {
      // PATCH KHÔNG gửi userId: BE chặn đổi chủ sở hữu (OmitType trong
      // UpdateCategoryDto), gửi kèm sẽ bị forbidNonWhitelisted trả 400.
      await categoriesApi.update(Number(id), { name, type });
    } else {
      await categoriesApi.create({ userId, name, type });
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath('/categories');

  return {
    status: 'ok',
    message: id ? `Đã cập nhật "${name}".` : `Đã thêm "${name}".`,
  };
}

export async function deleteCategory(id: number): Promise<FormState> {
  try {
    await categoriesApi.remove(id);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath('/categories');

  return { status: 'ok', message: `Đã xoá category #${id}.` };
}
