import { categoriesApi } from "@/services/categories";
import { ApiError } from "@/services/http";
import { transectionsApi } from "@/services/transections";
import type { Category, Transection } from "@/services/types";
import TransectionsManager from "./transections-manager";

/**
 * SERVER COMPONENT (mặc định trong App Router — không có 'use client').
 *
 * Chạy trên server nên được phép `await` thẳng trong thân component và gọi
 * transectionsApi (file có 'server-only'). Không có useState/useEffect ở đây,
 * và cũng không cần: dữ liệu đã sẵn sàng trước khi HTML được gửi đi.
 */
export const metadata = { title: "Transections — Chi Tiêu" };

export default async function TransectionsPage() {
  let transections: Transection[] = [];
  let categories: Category[] = [];
  let loadError: string | null = null;

  try {
    // Hai request ĐỘC LẬP nhau → Promise.all cho chúng chạy song song.
    // Danh sách category cần cho ô chọn trong form thêm mới.
    [transections, categories] = await Promise.all([
      transectionsApi.list(),
      categoriesApi.list(),
    ]);
  } catch (error) {
    loadError =
      error instanceof ApiError ? error.message : "Không tải được dữ liệu.";
  }

  return (
    <>
      <h1>Quản lý Giao dịch</h1>
      <p className="subtitle">
        Mỗi giao dịch thuộc về một category. Dữ liệu lấy từ{" "}
        <code>/api/transections</code>.
      </p>

      {loadError && <p className="alert alert-error">{loadError}</p>}

      <TransectionsManager
        transections={transections}
        categories={categories}
      />
    </>
  );
}
