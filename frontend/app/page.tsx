import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <h1>Chi Tiêu</h1>
      <p className="subtitle">
        Frontend Next.js gọi API NestJS ở <code>/api</code>.
      </p>

      <div className="card">
        <h2>Bắt đầu từ đâu</h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          Đăng nhập bằng Google để bắt đầu.
        </p>
        <div className="row">
          <Link href="/login">
            <button type="button" style={{ background: '#34A853' }}>Đăng nhập</button>
          </Link>
          <Link href="/users">
            <button type="button" className="secondary">Quản lý User</button>
          </Link>
          <Link href="/categories">
            <button type="button" className="secondary">
              Quản lý Category
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
