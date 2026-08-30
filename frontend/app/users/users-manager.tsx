'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { IDLE, type FormState } from '@/services/form-state';
import type { User } from '@/services/types';
import { deleteUser, saveUser } from './actions';

/**
 * CLIENT COMPONENT — 'use client' vì cần state + sự kiện onClick.
 *
 * Dữ liệu `users` KHÔNG fetch ở đây mà nhận qua props từ Server Component
 * cha (page.tsx). Nhờ vậy trang có dữ liệu ngay trong HTML lần đầu, và
 * component này chỉ lo phần tương tác.
 */
export default function UsersManager({ users }: { users: User[] }) {
  /** null = đang ở chế độ THÊM MỚI; có giá trị = đang SỬA user đó. */
  const [editing, setEditing] = useState<User | null>(null);

  /**
   * useActionState nối form với Server Action:
   *   state       — giá trị action trả về lần gần nhất
   *   formAction  — truyền vào <form action={...}>
   *   pending     — true trong lúc action đang chạy (React tự quản lý)
   *
   * Không cần useState cho loading, không cần preventDefault, không cần
   * tự gọi fetch: form submit thẳng tới server.
   */
  const [saveState, formAction, saving] = useActionState(saveUser, IDLE);

  const formRef = useRef<HTMLFormElement>(null);

  /**
   * Xoá không đi qua <form> nên phải tự giữ state.
   * useTransition cho biết action còn đang chạy hay không, đồng thời báo cho
   * React rằng việc render lại sau đó là "không gấp" — UI không bị đơ.
   */
  const [deleteState, setDeleteState] = useState<FormState>(IDLE);
  const [deleting, startDelete] = useTransition();

  // Lưu xong thì dọn form. Không đặt trong action được: action chạy trên
  // server, không với tới được DOM của trình duyệt.
  useEffect(() => {
    if (saveState.status === 'ok') {
      setEditing(null);
      formRef.current?.reset();
    }
  }, [saveState]);

  function handleDelete(user: User) {
    // Bước xác nhận cuối cùng trước một hành động không hoàn tác được.
    if (
      !confirm(`Xoá user "${user.name}"? Toàn bộ category của họ sẽ mất theo.`)
    ) {
      return;
    }
    startDelete(async () => {
      setDeleteState(await deleteUser(user.id));
    });
  }

  const busy = saving || deleting;

  return (
    <>
      <div className="card">
        <h2>{editing ? `Sửa user #${editing.id}` : 'Thêm user mới'}</h2>

        {/*
          key ép React DỰNG LẠI form mỗi khi đổi bản ghi đang sửa.
          Thiếu nó, defaultValue chỉ có tác dụng ở lần render đầu tiên —
          bấm "Sửa" ở dòng khác sẽ thấy ô input vẫn giữ giá trị cũ.
        */}
        <form
          key={editing?.id ?? 'new'}
          ref={formRef}
          action={formAction}
          className="row"
        >
          {/* Rỗng → action hiểu là tạo mới; có id → cập nhật. */}
          <input type="hidden" name="id" value={editing?.id ?? ''} />

          <div className="field">
            <label htmlFor="user-name">Tên</label>
            <input
              id="user-name"
              name="name"
              defaultValue={editing?.name ?? ''}
              placeholder="Nguyễn Văn A"
              required
              maxLength={100}
            />
          </div>

          <div className="field">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              name="email"
              type="email"
              defaultValue={editing?.email ?? ''}
              placeholder="a@example.com"
              required
            />
          </div>

          <div className="field" style={{ flex: '0 1 110px' }}>
            <label htmlFor="user-age">Tuổi</label>
            <input
              id="user-age"
              name="age"
              type="number"
              min={0}
              max={150}
              defaultValue={editing?.age ?? ''}
              placeholder="—"
            />
          </div>

          <div className="row" style={{ flex: '0 0 auto' }}>
            <button type="submit" disabled={busy}>
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
        <h2>Danh sách ({users.length})</h2>

        {deleteState.status !== 'idle' && (
          <p
            className={`alert ${deleteState.status === 'ok' ? 'alert-ok' : 'alert-error'}`}
          >
            {deleteState.message}
          </p>
        )}

        {users.length === 0 ? (
          <p className="empty">Chưa có user nào. Thêm một người ở trên.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th style={{ width: 70 }}>Tuổi</th>
                <th style={{ width: 130 }}>Tạo lúc</th>
                <th style={{ width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="muted">{user.id}</td>
                  <td>{user.name}</td>
                  <td className="small">{user.email}</td>
                  <td>{user.age ?? <span className="muted">—</span>}</td>
                  {/*
                    createdAt là CHUỖI ISO, không phải Date.
                    Định dạng theo locale 'vi-VN' cố định thay vì để mặc định:
                    server và trình duyệt có thể khác locale → React báo lỗi
                    hydration vì HTML hai bên không khớp.
                  */}
                  <td className="small muted">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setEditing(user)}
                        disabled={busy}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="link-danger"
                        onClick={() => handleDelete(user)}
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
