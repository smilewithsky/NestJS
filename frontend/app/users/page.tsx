import { ApiError } from '@/services/http';
import type { User } from '@/services/types';
import { usersApi } from '@/services/users';
import UsersManager from './users-manager';

/**
 * SERVER COMPONENT (mặc định trong App Router — không có 'use client').
 *
 * Chạy trên server nên được phép `await` thẳng trong thân component và gọi
 * usersApi (file có 'server-only'). Không có useState/useEffect ở đây, và
 * cũng không cần: dữ liệu đã sẵn sàng trước khi HTML được gửi đi.
 */
export const metadata = { title: 'Users — Chi Tiêu' };

export default async function UsersPage() {
  let users: User[] = [];
  let loadError: string | null = null;

  try {
    users = await usersApi.list();
  } catch (error) {
    // Không để lỗi lọt ra ngoài: ném ở đây là cả trang thành màn hình lỗi.
    // Backend chưa chạy là chuyện thường lúc dev — hiện một dòng nhắc
    // hữu ích hơn nhiều so với một stack trace.
    loadError =
      error instanceof ApiError
        ? error.message
        : 'Không tải được danh sách user.';
  }

  return (
    <>
      <h1>Quản lý User</h1>
      <p className="subtitle">
        Thêm, sửa, xoá người dùng. Dữ liệu lấy từ <code>/api/users</code>.
      </p>

      {loadError && <p className="alert alert-error">{loadError}</p>}

      <UsersManager users={users} />
    </>
  );
}
;