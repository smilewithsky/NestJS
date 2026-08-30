import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

/**
 * ROOT LAYOUT — bắt buộc phải có trong App Router.
 * Đây là component duy nhất được phép render thẻ <html> và <body>.
 * Nó bọc quanh MỌI trang và KHÔNG bị render lại khi chuyển trang
 * (nên state trong layout được giữ nguyên — khác hẳn Pages Router cũ).
 */
export const metadata: Metadata = {
  title: 'Chi Tiêu — Frontend',
  description: 'Next.js FE gọi API NestJS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <span className="brand">💸 Chi Tiêu</span>
            <nav className="nav">
              <Link href="#">Tổng quan</Link>
              <Link href="/users">Users</Link>
              <Link href="/categories">Categories</Link>
              <Link href="/transections">Transections</Link>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>
      </body>
    </html>
  );
}
