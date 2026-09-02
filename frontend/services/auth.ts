import "server-only";

import { request } from "./http";
import type { CreateUserInput, UpdateUserInput, User } from "./types";

/**
 * Các lời gọi tới /api/auth.
 */
export const authApi = {
  /**
   * GET /api/auth/me
   * Lấy thông tin user hiện tại (yêu cầu phải đăng nhập)
   */
  me: () => request<User>("/auth/me"),

  /**
   * POST /api/auth/login
   * Đăng nhập bằng email và password
   */
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /**
   * POST /api/auth/register
   * Đăng ký tài khoản mới
   */
  register: (email: string, password: string, name: string) =>
    request<{ accessToken: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  /**
   * GET /api/auth/google
   * Bắt đầu luồng đăng nhập Google
   * (Điều này được xử lý ở frontend bằng cách chuyển hướng)
   */
  getGoogleLoginUrl: () =>
    `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api"}/auth/google`,
};
