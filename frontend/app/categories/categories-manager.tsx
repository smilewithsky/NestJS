'use client';

import { useRouter } from 'next/navigation';
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { IDLE, type FormState } from '@/services/form-state';
import { CategoryType, type Category, type User } from '@/services/types';
import { deleteCategory, saveCategory } from './actions';

const TYPE_LABEL: Record<CategoryType, string> = {
  [CategoryType.INCOME]: 'Thu',
  [CategoryType.EXPENSE]: 'Chi',
};

interface Props {
  categories: Category[];
  users: User[];
  /** null = đang xem category của TẤT CẢ user */
  selectedUserId: number | null;
}

export default function CategoriesManager({
  categories,
  users,
  selectedUserId,
}: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState<Category | null>(null);
  const [saveState, formAction, saving] = useActionState(saveCategory, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  const [deleteState, setDeleteState] = useState<FormState>(IDLE);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (saveState.status === 'ok') {
      setEditing(null);
      formRef.current?.reset();
    }
  }, [saveState]);

  /**
   * Bộ lọc ghi vào URL chứ không giữ trong useState.
   *
   * Lý do: danh sách được fetch ở Server Component, mà server chỉ biết được
   * URL. Đẩy điều kiện lọc lên query string thì router.push khiến Next chạy
   * lại page với userId mới — và bonus là link có thể copy/bookmark, F5 vẫn
   * giữ nguyên bộ lọc.
   */
  function handleFilter(value: string) {
    router.push(value ? `/categories?userId=${value}` : '/categories');
  }

  function handleDelete(category: Category) {
    if (!confirm(`Xoá category "${category.name}"?`)) return;

    startDelete(async () => {
      setDeleteState(await deleteCategory(category.id));
    });
  }

  const busy = saving || deleting;
  // Chưa có user thì không thể tạo category (BE trả 404 "không tìm thấy user").
  const canCreate = users.length > 0;

  return (
    <>
      <div className="card">
        <div className="row">
          <div className="field" style={{ flex: '0 1 260px' }}>
            <label htmlFor="filter-user">Xem category của</label>
            <select
              id="filter-user"
              value={selectedUserId ?? ''}
              onChange={(event) => handleFilter(event.target.value)}
              disabled={busy}
            >
              <option value="">— Tất cả user —</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{editing ? `Sửa category #${editing.id}` : 'Thêm category mới'}</h2>

        {!canCreate && (
          <p className="alert alert-error">
            Chưa có user nào. Category luôn thuộc về một người — hãy tạo user ở
            trang Users trước.
          </p>
        )}

        <form
          key={editing?.id ?? 'new'}
          ref={formRef}
          action={formAction}
          className="row"
        >
          <input type="hidden" name="id" value={editing?.id ?? ''} />

          <div className="field">
            <label htmlFor="cat-user">Thuộc user</label>
            {editing ? (
              // Sửa thì KHÔNG cho đổi chủ sở hữu — khớp với BE, nơi
              // UpdateCategoryDto đã cắt userId ra khỏi body hợp lệ.
              <input
                id="cat-user"
                value={editing.user?.name ?? `user #${editing.user?.id ?? '?'}`}
                disabled
              />
            ) : (
              <select
                id="cat-user"
                name="userId"
                defaultValue={selectedUserId ?? ''}
                required
                disabled={!canCreate}
              >
                <option value="">— Chọn user —</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="field">
            <label htmlFor="cat-name">Tên category</label>
            <input
              id="cat-name"
              name="name"
              defaultValue={editing?.name ?? ''}
              placeholder="Ăn uống"
              required
              maxLength={100}
              disabled={!canCreate && !editing}
            />
          </div>

          <div className="field" style={{ flex: '0 1 140px' }}>
            <label htmlFor="cat-type">Loại</label>
            <select
              id="cat-type"
              name="type"
              defaultValue={editing?.type ?? CategoryType.EXPENSE}
              disabled={!canCreate && !editing}
            >
              <option value={CategoryType.EXPENSE}>Chi</option>
              <option value={CategoryType.INCOME}>Thu</option>
            </select>
          </div>

          <div className="row" style={{ flex: '0 0 auto' }}>
            <button type="submit" disabled={busy || (!canCreate && !editing)}>
              {saving ? 'Đang lưu…' : editing ? 'Lưu' : 'Thêm'}
            </button>

            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Huỷ
              </button>
            )}
          </div>
        </form>

        {saveState.status !== 'idle' && (
          <p
            className={`alert ${saveState.status === 'ok' ? 'alert-ok' : 'alert-error'}`}
            style={{ marginTop: 14, marginBottom: 0 }}
          >
            {saveState.message}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Danh sách ({categories.length})</h2>

        {deleteState.status !== 'idle' && (
          <p
            className={`alert ${deleteState.status === 'ok' ? 'alert-ok' : 'alert-error'}`}
          >
            {deleteState.message}
          </p>
        )}

        {categories.length === 0 ? (
          <p className="empty">Chưa có category nào ở đây.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}>ID</th>
                <th>Tên</th>
                <th style={{ width: 90 }}>Loại</th>
                <th style={{ width: 160 }}>Chủ sở hữu</th>
                <th style={{ width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="muted">{category.id}</td>
                  <td>{category.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        category.type === CategoryType.INCOME
                          ? 'badge-income'
                          : 'badge-expense'
                      }`}
                    >
                      {TYPE_LABEL[category.type]}
                    </span>
                  </td>
                  <td className="small muted">{category.user?.name ?? '—'}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setEditing(category)}
                        disabled={busy}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="link-danger"
                        onClick={() => handleDelete(category)}
                        disabled={busy}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
