import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Không cấu hình gì đặc biệt: mọi lời gọi API đều đi qua lib/api.ts,
  // chạy ở phía SERVER của Next (Server Component / Server Action)
  // nên không dính CORS và không lộ URL nội bộ ra trình duyệt.
};

export default nextConfig;
