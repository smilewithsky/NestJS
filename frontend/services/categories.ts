import "server-only";

import { request } from "./http";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./types";

/** Các lời gọi tới /api/categories — 5 route CRUD bên NestJS. */
export const categoriesApi = {
  /**
   * GET /api/categories?userId=1
   * Bỏ trống userId → lấy toàn bộ category của mọi user.
   */
  list: (userId?: number) =>
    request<Category[]>(
      // URLSearchParams tự lo phần encode; nối chuỗi bằng tay là chỗ
      // hay quên khi giá trị có ký tự đặc biệt.
      userId
        ? `/categories?${new URLSearchParams({ userId: String(userId) })}`
        : "/categories",
    ),

  getOne: (id: number) => request<Category>(`/categories/${id}`),

  create: (input: CreateCategoryInput) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateCategoryInput) =>
    request<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    request<void>(`/categories/${id}`, {
      method: "DELETE",
    }),
};
