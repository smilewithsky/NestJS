import 'server-only';

import { request } from './http';
import type { CreateUserInput, UpdateUserInput, User } from './types';

/**
 * Các lời gọi tới /api/users.
 *
 * File này KHÔNG bắt lỗi: `request()` ném ApiError, và người gọi
 * (Server Action) mới là chỗ biết phải hiển thị lỗi ra sao.
 * Bắt lỗi ở đây rồi trả null sẽ làm mất status code lẫn message của BE.
 */
export const usersApi = {
  list: () => request<User[]>('/users'),

  getOne: (id: number) => request<User>(`/users/${id}`),

  create: (input: CreateUserInput) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: number, input: UpdateUserInput) =>
    request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    request<void>(`/users/${id}`, {
      method: 'DELETE',
    }),
};
