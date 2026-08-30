import 'server-only';

import { request } from './http';
import type {
  Transection,
  CreateTransectionInput,
  UpdateTransectionInput,
} from './types';

/**
 * Các lời gọi tới /api/transections — 5 route CRUD bên NestJS.
 *
 * File này chỉ làm ĐÚNG một việc: dịch từ lời gọi hàm sang HTTP.
 * Không format số, không bắt lỗi, không quyết định hiển thị gì —
 * để những việc đó cho tầng trên, nhờ vậy đổi UI không phải đụng vào đây.
 */
export const transectionsApi = {
  /**
   * GET /api/transections
   *
   * BE có `relations: { category: true }` nên mỗi phần tử kèm sẵn object
   * category — không cần gọi thêm N lần để lấy tên danh mục.
   */
  list: () => request<Transection[]>('/transections'),

  getOne: (id: number) => request<Transection>(`/transections/${id}`),

  create: (input: CreateTransectionInput) =>
    request<Transection>('/transections', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateTransectionInput) =>
    request<Transection>(`/transections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    request<void>(`/transections/${id}`, {
      method: 'DELETE',
    }),
};
