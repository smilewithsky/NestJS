import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, setSessionToken } from '@/services/session';
import { API_BASE_URL } from '@/services/http';

/**
 * CALLBACK TỪ GOOGLE.
 *
 * Luồng:
 * 1. User bấm "Đăng nhập với Google" ở /login
 * 2. Trình duyệt chuyển hướng đến /api/auth/google trên backend
 * 3. Backend (GoogleAuthGuard) xác thực với Google rồi chuyển hướng
 *    về /auth/google/callback trên backend
 * 4. Backend ký JWT và SET-COOKIE rồi chuyển hướng đến đây
 *    (/auth/callback?token=...) trên frontend
 * 5. Trang này lưu token vào cookie rồi chuyển hướng về home
 */
export default async function GoogleCallbackPage(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams.token as string | undefined;
  const error = searchParams.error as string | undefined;

  // Nếu có lỗi từ backend
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error)}`);
  }

  // Nếu không có token, chuyển hướng về trang đăng nhập
  if (!token) {
    redirect('/login?error=no_token');
  }

  // Lưu token vào cookie
  await setSessionToken(token);

  // Chuyển hướng về trang chủ
  redirect('/');
}
