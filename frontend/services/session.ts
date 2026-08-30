import 'server-only';

import { cookies } from 'next/headers';

/**
 * PHIÊN ĐĂNG NHẬP — lưu JWT trong cookie httpOnly.
 *
 * VÌ SAO KHÔNG DÙNG localStorage:
 *   localStorage đọc được bằng JavaScript. Chỉ cần một script lạ chạy được
 *   trên trang (XSS: một thư viện npm bị chèn mã, một đoạn HTML người dùng
 *   nhập vào không được escape...) là token bị lấy đi ngay.
 *   Cookie `httpOnly` thì JavaScript KHÔNG đọc được — chỉ trình duyệt gửi
 *   kèm request, và ở đây chỉ có server của Next đọc ra để gọi NestJS.
 *
 * Đổi lại, mọi lời gọi API phải chạy ở phía server (Server Component /
 * Server Action / Route Handler) — đúng kiến trúc sẵn có của dự án này.
 */
export const SESSION_COOKIE = 'access_token';

/** 7 ngày, khớp với JWT_EXPIRES_IN bên backend. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Đọc token của request hiện tại. null = chưa đăng nhập. */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Ghi token vào cookie.
 *
 * CHỈ gọi được từ Server Action hoặc Route Handler. Gọi trong lúc render
 * một Server Component sẽ lỗi — vì lúc đó Next đã bắt đầu gửi HTML đi rồi,
 * không thêm được header Set-Cookie nữa.
 */
export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true, // JS phía client không đọc được
    // secure chỉ cho phép gửi qua HTTPS — bật ở production, tắt ở localhost
    // (localhost dùng http nên bật lên là cookie không bao giờ được lưu).
    secure: process.env.NODE_ENV === 'production',
    /**
     * 'lax': cookie VẪN được gửi khi người dùng được chuyển hướng từ trang
     * khác về đây bằng link/GET — chính là bước Google đẩy về /auth/callback.
     * Để 'strict' thì luồng đăng nhập Google sẽ hỏng.
     */
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Xoá cookie — chính là "đăng xuất" ở phía FE. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
