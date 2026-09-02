"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { IDLE, type FormState } from "@/services/form-state";
import {
  CategoryType,
  type Category,
  type Transection,
} from "@/services/types";
import { deleteTransection, saveTransection } from "./actions";

/**
 * `amount` từ BE là CHUỖI (cột decimal — xem chú thích ở services/types.ts).
 * Phải Number() trước khi format, và cũng đừng cộng dồn trực tiếp trên chuỗi.
 */
function formatAmount(amount: string): string {
  return `${Number(amount).toLocaleString("vi-VN")} ₫`;
}

interface Props {
  transections: Transection[];
  categories: Category[];
}

export default function TransectionsManager({
  transections,
  categories,
}: Props) {
  const [editing, setEditing] = useState<Transection | null>(null);
  const [saveState, formAction, saving] = useActionState(saveTransection, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  const [deleteState, setDeleteState] = useState<FormState>(IDLE);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (saveState.status === "ok") {
      setEditing(null);
      formRef.current?.reset();
    }
  }, [saveState]);

  function handleDelete(transection: Transection) {
    if (!confirm(`Xoá giao dịch "${transection.description}"?`)) return;

    startDelete(async () => {
      setDeleteState(await deleteTransection(transection.id));
    });
  }

  const busy = saving || deleting;
  // Chưa có category thì không tạo được giao dịch (BE trả lỗi "not found").
  const canCreate = categories.length > 0;

  return (
    <>
      <div className="card">
        <h2>
          {editing ? `Sửa giao dịch #${editing.id}` : "Thêm giao dịch mới"}
        </h2>

        {!canCreate && (
          <p className="alert alert-error">
            Chưa có category nào. Mỗi giao dịch phải thuộc một danh mục — hãy
            tạo category ở trang Categories trước.
          </p>
        )}

        {/*
          `key` đổi theo bản ghi đang sửa để React DỰNG LẠI form thay vì tái
          dùng DOM cũ. Không có nó, defaultValue chỉ có tác dụng ở lần render
          đầu — bấm Sửa bản ghi thứ hai sẽ vẫn thấy dữ liệu của bản ghi trước.
        */}
        <form
          key={editing?.id ?? "new"}
          ref={formRef}
          action={formAction}
          className="row"
        >
          <input type="hidden" name="id" value={editing?.id ?? ""} />

          <div className="field">
            <label htmlFor="tr-category">Danh mục</label>
            {editing ? (
              // Sửa thì KHÔNG cho đổi danh mục — khớp với BE, nơi
              // UpdateTransectionDto không nhận categoryId.
              <input
                id="tr-category"
                value={
                  editing.category?.name ??
                  `category #${editing.category?.id ?? "?"}`
                }
                disabled
              />
            ) : (
              <select
                id="tr-category"
                name="categoryId"
                defaultValue=""
                required
                disabled={!canCreate}
              >
                <option value="">— Chọn danh mục —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} (
                    {category.type === CategoryType.INCOME ? "Thu" : "Chi"})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="field">
            <label htmlFor="tr-description">Mô tả</label>
            <input
              id="tr-description"
              name="description"
              defaultValue={editing?.description ?? ""}
              placeholder="Ăn trưa"
              required
              maxLength={255}
              disabled={!canCreate && !editing}
            />
          </div>

          <div className="field" style={{ flex: "0 1 180px" }}>
            <label htmlFor="tr-amount">Số tiền (₫)</label>
            <input
              id="tr-amount"
              name="amount"
              type="number"
              // step=1 để trình duyệt chặn số lẻ ngay tại chỗ — BE khai
              // @IsInt() nên 12.5 sẽ bị trả 400.
              step={1}
              min={0}
              defaultValue={editing ? Number(editing.amount) : ""}
              placeholder="50000"
              required
              disabled={!canCreate && !editing}
            />
          </div>

          <div className="row" style={{ flex: "0 0 auto" }}>
            <button type="submit" disabled={busy || (!canCreate && !editing)}>
              {saving ? "Đang lưu…" : editing ? "Lưu" : "Thêm"}
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

        {saveState.status !== "idle" && (
          <p
            className={`alert ${saveState.status === "ok" ? "alert-ok" : "alert-error"}`}
            style={{ marginTop: 14, marginBottom: 0 }}
          >
            {saveState.message}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Danh sách ({transections.length})</h2>

        {deleteState.status !== "idle" && (
          <p
            className={`alert ${deleteState.status === "ok" ? "alert-ok" : "alert-error"}`}
          >
            {deleteState.message}
          </p>
        )}

        {transections.length === 0 ? (
          <p className="empty">Chưa có giao dịch nào.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}>ID</th>
                <th>Mô tả</th>
                <th style={{ width: 150 }}>Danh mục</th>
                <th style={{ width: 90 }}>Loại</th>
                <th style={{ width: 140 }}>Số tiền</th>
                <th style={{ width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {transections.map((transection) => (
                <tr key={transection.id}>
                  <td className="muted">{transection.id}</td>
                  <td>{transection.description}</td>
                  <td className="small muted">
                    {transection.category?.name ?? "—"}
                  </td>
                  <td>
                    {transection.category ? (
                      <span
                        className={`badge ${
                          transection.category.type === CategoryType.INCOME
                            ? "badge-income"
                            : "badge-expense"
                        }`}
                      >
                        {transection.category.type === CategoryType.INCOME
                          ? "Thu"
                          : "Chi"}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>{formatAmount(transection.amount)}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setEditing(transection)}
                        disabled={busy}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="link-danger"
                        onClick={() => handleDelete(transection)}
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
