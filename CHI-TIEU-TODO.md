# App Chi Tiêu Cá Nhân — Đề bài & Checklist

> Quy tắc: **tự viết code, không copy-paste.** Xong mốc nào phải chạy được mốc đó
> trên Postman rồi mới sang mốc sau. Kẹt ở đâu thì hỏi, đừng bỏ qua.

---

## Schema dự kiến

```
users (đã có sẵn)
  id, name, email, age, created_at, updated_at

categories
  id, name (vd "Ăn uống"), type ('income' | 'expense'), user_id → users.id

transactions
  id, amount, note, occurred_at
  category_id → categories.id
  user_id     → users.id
```

### Ba quyết định thiết kế bạn phải tự trả lời

- [ ] `amount` dùng kiểu gì? **Không được dùng `float`** — số thực nhị phân làm tiền
      sai lệch dần. Tra `decimal` trong TypeORM, rồi để ý một điều lạ: đọc ra
      sẽ là `string` chứ không phải `number`. Tự tìm hiểu vì sao, và bạn định
      xử lý nó ở tầng nào?
- [ ] `type` ('income' | 'expense') nên khai báo enum ở đâu: TS type,
      class-validator, hay cả cột DB? Chọn và giải thích được lý do.
- [ ] `transactions` đã có `user_id`, mà `categories` cũng có `user_id`.
      Thừa hay không thừa? (Gợi ý: nghĩ về câu query "tổng chi tháng này của tôi")

---

## Mốc 1 — `categories` CRUD

Copy **khuôn** của module `users`, nhưng gõ lại bằng tay từng dòng.

- [ ] `Category` entity
- [ ] `CreateCategoryDto` + `UpdateCategoryDto`
- [ ] `CategoriesService` — 5 hàm CRUD
- [ ] `CategoriesController` — 5 route
- [ ] `CategoriesModule` + đăng ký vào `AppModule`

**Xong khi:** 5 endpoint chạy trên Postman, và tạo category trùng tên trả về
409 chứ không phải 500.

---

## Mốc 2 — `transactions` + quan hệ  ⭐ mốc đáng giá nhất

- [ ] `Transaction` entity với `@ManyToOne` trỏ về `Category` và `User`
- [ ] Phía `Category` khai `@OneToMany` ngược lại
- [ ] CRUD đầy đủ cho transactions
- [ ] Tạo transaction với `categoryId` **không tồn tại** → trả **404**,
      không được để lỗi 500 của Postgres lọt ra ngoài. Tự nghĩ xem check ở đâu:
      controller, service, hay để DB tự chặn?
- [ ] `GET /api/transactions` trả kèm **tên category**, không phải mỗi `categoryId`.
      Mặc định TypeORM KHÔNG join — tra option `relations` trong `find()`.

**Bài tập bắt buộc của mốc này:** bật `logging` trong [app.module.ts](src/app.module.ts),
list 20 giao dịch, rồi **đếm số câu SQL in ra terminal**.
Nếu thấy 21 câu → bạn vừa tự tay gặp bài toán **N+1 query**. Đó mới là mục tiêu
thật của mốc này, CRUD chỉ là cái vỏ.

---

## Mốc 3 — Lọc + phân trang

`GET /api/transactions?from=2026-08-01&to=2026-08-31&categoryId=3&page=1&limit=10`

- [ ] `QueryTransactionDto` — nhớ rằng query param **luôn là string**,
      cần `@Type(() => Number)` của class-transformer để ép kiểu
- [ ] Trả về `{ data, total, page, limit }` — **không** trả mảng trần
- [ ] Điều kiện lọc động: có `from` thì thêm, không có thì bỏ.
      Thử làm bằng object `where` trước; thấy vướng thì mới chuyển sang
      `createQueryBuilder`. Trải nghiệm cái vướng đó là có chủ đích.

**Xong khi:** bỏ hết param vẫn chạy, truyền từng param một vẫn đúng,
và SQL sinh ra có `LIMIT ... OFFSET ...`.

---

## Mốc 4 — Thống kê

`GET /api/transactions/summary?month=2026-08`

Trả về: tổng thu, tổng chi, số dư, và breakdown theo từng category.

- [ ] Tính bằng `SUM` + `GROUP BY` **ở database**.
      Cấm load hết bản ghi về rồi cộng bằng `reduce` trong JS —
      cách đó chết ngay khi có 100k giao dịch.

⚠️ **Cạm bẫy:** route `summary` phải khai báo **TRƯỚC** `@Get(':id')` trong
controller. Nếu không, Nest sẽ khớp `summary` vào `:id` và `ParseIntPipe`
trả về 400. Cứ thử đặt sai một lần cho nhớ.

---

## Mốc 5 — Auth (chỉ làm khi 4 mốc trên đã xong)

- [ ] Thêm `password_hash` vào `User` (bcrypt — **không bao giờ** lưu mật khẩu thô)
- [ ] `POST /api/auth/register`, `POST /api/auth/login` → trả JWT
- [ ] `JwtAuthGuard` bảo vệ toàn bộ route categories & transactions
- [ ] Decorator `@CurrentUser()` tự viết
- [ ] Bỏ mọi chỗ đang nhận `userId` từ body/query — lấy từ token
- [ ] User A không được xem/sửa/xoá dữ liệu của user B (tự test bằng 2 token)

---

## Sau cùng, trước khi coi là "xong"

- [ ] Tắt `synchronize: true`, chuyển sang **migration**
      (bắt buộc trước production — xem [NESTJS-GUIDE.md](NESTJS-GUIDE.md) mục 9)
- [ ] Unit test cho `TransactionsService` với repository giả
- [ ] Exception filter toàn cục để format lỗi thống nhất

---

## Nhật ký (tự ghi lại khi làm)

| Ngày | Mốc | Chỗ bị kẹt | Cách gỡ |
|------|-----|------------|---------|
|      |     |            |         |
