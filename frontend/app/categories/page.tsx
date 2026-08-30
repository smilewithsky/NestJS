import { categoriesApi } from '@/services/categories';
import { ApiError } from '@/services/http';
import type { Category, User } from '@/services/types';
import { usersApi } from '@/services/users';
import CategoriesManager from './categories-manager';

export const metadata = { title: 'Categories — Chi Tiêu' };

/**
 * Trong Next 15, `searchParams` là một PROMISE chứ không còn là object.
 * Đây là thay đổi phá vỡ so với Next 14: đọc thẳng `searchParams.userId`
 * sẽ ra undefined mà không báo lỗi rõ ràng — phải await trước.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  // Query param luôn là string, và có thể là rác ("?userId=abc").
  // Number('abc') = NaN → quy về null để coi như "không lọc".
  const parsed = Number(userId);
  const selectedUserId = userId && Number.isInteger(parsed) ? parsed : null;

  let categories: Category[] = [];
  let users: User[] = [];
  let loadError: string | null = null;

  try {
    // Hai request ĐỘC LẬP nhau → Promise.all cho chúng chạy song song.
    // Viết hai `await` liên tiếp thì tổng thời gian bằng phép cộng,
    // ở đây chỉ bằng cái chậm hơn.
    [categories, users] = await Promise.all([
      categoriesApi.list(selectedUserId ?? undefined),
      usersApi.list(),
    ]);
  } catch (error) {
    loadError =
      error instanceof ApiError ? error.message : 'Không tải được dữ liệu.';
  }

  return (
    <>
      <h1>Quản lý Category</h1>
      <p className="subtitle">
        Mỗi category thuộc về một user và có loại <code>thu</code> hoặc{' '}
        <code>chi</code>.
      </p>

      {loadError && <p className="alert alert-error">{loadError}</p>}

      <CategoriesManager
        categories={categories}
        users={users}
        selectedUserId={selectedUserId}
      />
    </>
  );
}
