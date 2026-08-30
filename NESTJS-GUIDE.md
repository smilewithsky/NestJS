# NestJS — Cấu trúc code & Flow chạy

Tài liệu này giải thích chính xác project trong repo hiện tại (module `books`), không phải ví dụ chung chung.

---

## 1. Bức tranh tổng thể

NestJS xây trên 4 khái niệm. Nhớ được 4 cái này là hiểu 80% framework:

| Khái niệm | File | Vai trò | Câu hỏi nó trả lời |
|---|---|---|---|
| **Module** | `books.module.ts` | Gom nhóm & khai báo | "Trong tính năng này có những gì?" |
| **Controller** | `books.controller.ts` | Nhận HTTP request | "URL nào gọi hàm nào?" |
| **Service** | `books.service.ts` | Chứa logic nghiệp vụ | "Làm gì với dữ liệu?" |
| **Entity / DTO** | `entities/`, `dto/` | Hình dạng dữ liệu | "Dữ liệu trông như thế nào?" |

Nguyên tắc vàng: **Controller không được chứa logic. Service không được biết gì về HTTP.**

Controller chỉ làm 3 việc: nhận request → gọi service → trả kết quả. Nếu bạn thấy mình viết `if/else` nghiệp vụ trong controller, tức là đang đặt sai chỗ.

---

## 2. Cây thư mục

```
src/
├── main.ts                    ← Điểm khởi động (entry point)
├── app.module.ts              ← Module gốc, gom mọi module con
├── app.controller.ts
├── app.service.ts
│
├── books/                     ← Một "feature module" hoàn chỉnh
│   ├── books.module.ts        ← Bảng khai báo của module
│   ├── books.controller.ts    ← Tầng HTTP
│   ├── books.service.ts       ← Tầng nghiệp vụ
│   ├── dto/
│   │   ├── create-book.dto.ts ← Dữ liệu ĐI VÀO (input)
│   │   └── update-book.dto.ts
│   └── entities/
│       └── book.entity.ts     ← Bảng trong database
│
└── users/                     ← Cấu trúc y hệt books
```

Quy ước: **mỗi tính năng = 1 thư mục = 1 module.** Muốn thêm tính năng `orders`? Tạo `src/orders/` với đúng bộ file như trên. Lệnh `nest g resource orders` sinh sẵn toàn bộ.

---

## 3. Giai đoạn khởi động (chạy 1 lần lúc `npm run start:dev`)

### Bước 1 — `main.ts` bật app

```ts
const app = await NestFactory.create(AppModule);
```

Dòng này bảo Nest: "đọc `AppModule`, đi theo mọi `imports` của nó, dựng toàn bộ ứng dụng."

Sau đó `main.ts` cấu hình 3 thứ ảnh hưởng đến **mọi** request:

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // field thừa (không có trong DTO) → tự động bị xoá
  forbidNonWhitelisted: true,   // field thừa → ném lỗi 400 luôn thay vì xoá âm thầm
  transform: true,              // JSON thô → biến thành instance của class DTO
}));

app.setGlobalPrefix('api');     // mọi route thành /api/...
await app.listen(port);         // mở cổng, bắt đầu nghe
```

> `transform: true` là thứ khiến `@Param('id', ParseIntPipe)` trả về `number` thật chứ không phải chuỗi `"5"`.

### Bước 2 — `AppModule` dựng cây phụ thuộc

```ts
imports: [
  ConfigModule.forRoot({ isGlobal: true }),   // đọc file .env
  TypeOrmModule.forRootAsync({ ... }),        // mở kết nối PostgreSQL
  UsersModule,
  BooksModule,
]
```

Thứ tự quan trọng: `ConfigModule` phải nạp trước, vì `TypeOrmModule` cần `ConfigService` để đọc `DB_HOST`, `DB_PASSWORD`... `forRootAsync` chính là cách nói "chờ có config rồi hãy tạo kết nối DB".

Hai cờ đáng chú ý trong cấu hình TypeORM hiện tại:

- `synchronize: true` — TypeORM tự sửa cấu trúc bảng cho khớp entity. **Rất tiện khi học, cấm dùng ở production** (nó có thể xoá cột và mất dữ liệu). Khi làm thật, thay bằng migration.
- `logging: true` — in ra mọi câu SQL mà ORM sinh ra. **Giữ nguyên cờ này.** Đây là cách học SQL miễn phí: mỗi lần gọi API, nhìn terminal xem ORM dịch thành SQL gì.

### Bước 3 — `BooksModule` đăng ký các thành phần

```ts
@Module({
  imports: [TypeOrmModule.forFeature([Book])],  // "module này cần Repository<Book>"
  controllers: [BooksController],               // route thuộc module này
  providers: [BooksService],                    // thứ có thể được inject
  exports: [BooksService],                      // module khác được phép dùng BooksService
})
```

Bốn khoá này hay nhầm, phân biệt như sau:

- `providers` — **tạo ra** service, dùng nội bộ module.
- `exports` — **cho mượn** ra ngoài. Không có dòng này thì module khác import `BooksModule` vẫn không dùng được `BooksService`.
- `imports` — **đi mượn** từ module khác.
- `controllers` — chỉ chứa controller, không bao giờ chứa service.

### Bước 4 — Dependency Injection ráp mọi thứ lại

Để ý là **không nơi nào trong code có `new BooksService()`**. Bạn chỉ khai báo nhu cầu ở constructor:

```ts
// books.controller.ts
constructor(private readonly booksService: BooksService) {}

// books.service.ts
constructor(
  @InjectRepository(Book)
  private readonly booksRepository: Repository<Book>,
) {}
```

Nest đọc kiểu dữ liệu ở constructor, tự tìm trong "hộp đồ" (IoC container) và đưa vào. Chuỗi lắp ráp lúc khởi động:

```
Repository<Book>  →  BooksService  →  BooksController
```

Đây là lý do backend NestJS dễ test: lúc viết unit test, bạn đưa vào một repository giả (mock) thay cho repository thật, service không hề biết.

Khởi động xong, Nest có một **bảng định tuyến**:

```
POST   /api/books      → BooksController.create
GET    /api/books      → BooksController.findAll
GET    /api/books/:id  → BooksController.findOne
PATCH  /api/books/:id  → BooksController.update
DELETE /api/books/:id  → BooksController.remove
```

---

## 4. Flow một request — theo dấu `POST /api/books`

Đây là phần quan trọng nhất. Giả sử client gửi:

```http
POST /api/books
Content-Type: application/json

{ "name": "Đắc Nhân Tâm", "chapter": 30 }
```

### Đường đi vào

```
   HTTP Request
        │
        ▼
┌───────────────────┐
│ 1. Middleware     │   (project này chưa dùng — chỗ đặt logger, cors)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 2. Guard          │   (chưa dùng — chỗ đặt xác thực JWT, phân quyền)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 3. Interceptor    │   (chưa dùng — chỗ bọc response, đo thời gian)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 4. Pipe           │   ⭐ ValidationPipe chạy ở đây
│    (Validation)   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 5. Controller     │   BooksController.create()
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 6. Service        │   BooksService.create()
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 7. Repository     │   TypeORM sinh câu SQL
└───────────────────┘
        │
        ▼
    PostgreSQL
```

### Chi tiết từng chặng

**Chặng 4 — ValidationPipe kiểm tra DTO**

Nest thấy tham số khai báo kiểu `CreateBookDto`, nên nó đối chiếu JSON với các decorator trong file đó:

```ts
export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  chapter: number;
}
```

Kết quả có thể xảy ra:

| Body gửi lên | Kết quả |
|---|---|
| `{ "name": "ABC", "chapter": 30 }` | ✅ đi tiếp vào controller |
| `{ "name": "", "chapter": 30 }` | ❌ 400 — `name should not be empty` |
| `{ "name": "ABC", "chapter": -5 }` | ❌ 400 — `chapter must not be less than 0` |
| `{ "name": "ABC", "chapter": 30, "hacker": 1 }` | ❌ 400 — do `forbidNonWhitelisted: true` |

**Điểm mấu chốt: request sai không bao giờ chạm tới service.** Nhờ vậy service được viết với giả định "dữ liệu đã sạch", code gọn hơn nhiều.

**Chặng 5 — Controller (chỉ điều phối, không nghĩ)**

```ts
@Post()
create(@Body() createBookDto: CreateBookDto) {
  return this.booksService.create(createBookDto);
}
```

Đúng 1 dòng. Đây là chuẩn — controller mà dài là dấu hiệu logic bị đặt nhầm chỗ.

Các decorator lấy dữ liệu từ request:

| Decorator | Lấy từ đâu | Ví dụ |
|---|---|---|
| `@Body()` | body JSON | `{ name, chapter }` |
| `@Param('id')` | đường dẫn URL | `/books/5` → `5` |
| `@Query('page')` | query string | `?page=2` → `2` |
| `@Headers('authorization')` | header | `Bearer xxx` |

**Chặng 6 — Service (nơi chứa nghiệp vụ)**

```ts
create(createBookDto: CreateBookDto): Promise<Book> {
  const book = this.booksRepository.create(createBookDto);  // tạo object trong RAM
  return this.booksRepository.save(book);                   // ghi xuống DB
}
```

Hai hàm này hay bị nhầm:
- `.create()` — **chỉ dựng object** trong bộ nhớ, chưa hề đụng database.
- `.save()` — mới thực sự chạy `INSERT`, và trả về bản ghi kèm `id`, `createdAt` do DB sinh ra.

**Chặng 7 — TypeORM sinh SQL**

Vì `logging: true`, terminal sẽ in:

```sql
INSERT INTO "books"("name", "chapter", "createdAt", "updatedAt")
VALUES ($1, $2, DEFAULT, DEFAULT)
RETURNING "id", "createdAt", "updatedAt"
```

Bảng `books` này do `book.entity.ts` định nghĩa:

```ts
@Entity('books')                    // → tên bảng: books
export class Book {
  @PrimaryGeneratedColumn()         // → id SERIAL PRIMARY KEY
  id: number;

  @Column()                         // → name VARCHAR NOT NULL
  name: string;

  @Column({ default: 0 })           // → chapter INT DEFAULT 0
  chapter: number;

  @CreateDateColumn()               // → tự set khi INSERT
  createdAt: Date;

  @UpdateDateColumn()               // → tự cập nhật mỗi lần UPDATE
  updatedAt: Date;
}
```

### Đường đi ra

Object `Book` được trả ngược lên: Service → Controller → Nest tự `JSON.stringify` → client nhận:

```json
{
  "id": 1,
  "name": "Đắc Nhân Tâm",
  "chapter": 30,
  "createdAt": "2026-07-26T10:00:00.000Z",
  "updatedAt": "2026-07-26T10:00:00.000Z"
}
```

Bạn **không cần** viết `res.json()`. Cứ `return` một giá trị (kể cả Promise), Nest lo phần còn lại. Mã trạng thái mặc định: `@Post` → 201, các method khác → 200.

---

## 5. Entity vs DTO — điểm gây nhầm nhiều nhất

Người mới hay hỏi: "hai file này gần giống nhau, sao phải tách?"

| | **Entity** (`book.entity.ts`) | **DTO** (`create-book.dto.ts`) |
|---|---|---|
| Mô tả | Bảng trong database | Dữ liệu client được phép gửi |
| Decorator | `@Column`, `@Entity` (TypeORM) | `@IsString`, `@Min` (class-validator) |
| Ai quyết định | Bạn (thiết kế DB) | Hợp đồng API |
| Có `id`, `createdAt`? | Có | **Không** |

Lý do tách rất thực tế: `Book` có `id`, `createdAt`, `updatedAt` — nhưng client **không được phép** tự đặt những giá trị đó. Nếu dùng thẳng entity làm input, ai đó có thể gửi `{"id": 999}` và phá dữ liệu.

Sau này khi thêm `User` có cột `password`, việc tách còn quan trọng hơn: entity có `password`, nhưng response DTO thì tuyệt đối không.

**Mẹo `PartialType`:**

```ts
export class UpdateBookDto extends PartialType(CreateBookDto) {}
```

Một dòng này biến mọi field của `CreateBookDto` thành optional — hợp với `PATCH` (sửa một phần). Không cần chép lại decorator.

---

## 6. Flow xử lý lỗi

Xem `findOne`:

```ts
async findOne(id: number): Promise<Book> {
  const book = await this.booksRepository.findOne({ where: { id } });
  if (!book) {
    throw new NotFoundException(`Book #${id} not found`);
  }
  return book;
}
```

`throw` ở đây **không** làm sập server. Nest có một bộ lọc lỗi toàn cục bắt lấy và dịch thành HTTP response:

```json
{ "statusCode": 404, "message": "Book #99 not found", "error": "Not Found" }
```

Các exception hay dùng:

| Class | Mã | Khi nào |
|---|---|---|
| `BadRequestException` | 400 | Dữ liệu sai |
| `UnauthorizedException` | 401 | Chưa đăng nhập |
| `ForbiddenException` | 403 | Đã đăng nhập nhưng không đủ quyền |
| `NotFoundException` | 404 | Không tìm thấy |
| `ConflictException` | 409 | Trùng lặp (email đã tồn tại) |

Để ý cách `update` và `remove` tái sử dụng `findOne`:

```ts
async update(id: number, dto: UpdateBookDto): Promise<Book> {
  const book = await this.findOne(id);      // ← tự động ném 404 nếu không có
  Object.assign(book, dto);
  return this.booksRepository.save(book);
}
```

Không phải lặp lại việc kiểm tra tồn tại ở từng hàm. Đây là một pattern nên bắt chước.

---

## 7. Bảng tra cứu nhanh: "muốn làm X thì sửa file nào?"

| Muốn làm gì | Sửa file nào |
|---|---|
| Thêm route mới (VD: `GET /books/search`) | `books.controller.ts` |
| Đổi logic nghiệp vụ | `books.service.ts` |
| Thêm cột vào bảng DB | `entities/book.entity.ts` |
| Thêm luật kiểm tra input | `dto/create-book.dto.ts` |
| Dùng service của module khác | `books.module.ts` (`imports`) + module kia phải `exports` |
| Đổi cấu hình DB / cổng chạy | `.env` + `app.module.ts` |
| Thêm việc chạy trước mọi request | `main.ts` (global) hoặc `app.module.ts` |

---

## 8. Bài tập để hiểu sâu hơn

Làm theo thứ tự, mỗi bài đều dựa trên bài trước:

1. **Thêm cột `author` vào `Book`.** Sửa entity + DTO, xem terminal in ra câu `ALTER TABLE` gì (nhờ `synchronize: true`).
2. **Thêm `GET /api/books?name=abc`** để tìm theo tên. Dùng `@Query()` ở controller và `Like` của TypeORM ở service.
3. **Thêm phân trang** `?page=1&limit=10`. Tra `skip` / `take` trong TypeORM, và xem SQL sinh ra có `LIMIT ... OFFSET ...` không.
4. **Nối quan hệ `User` ↔ `Book`** (một user có nhiều book). Dùng `@ManyToOne` / `@OneToMany`. Đây là bài khó nhất và cũng đáng giá nhất — nó dạy bạn `JOIN` và vấn đề N+1 query.
5. **Tắt `logging: true`, tự viết lại query bằng `createQueryBuilder`** rồi so sánh SQL với cách dùng `.find()`.

---

## 9. Lộ trình tiếp theo

Sau khi nắm chắc CRUD + quan hệ, học theo thứ tự này:

1. **Auth** — JWT, `@nestjs/passport`, Guard, decorator `@CurrentUser()` tự viết
2. **Interceptor** — chuẩn hoá response `{ data, message }`, logging thời gian xử lý
3. **Exception Filter** — bắt lỗi toàn cục, format lỗi thống nhất
4. **Migration** — bỏ `synchronize: true`, dùng `typeorm migration:generate` (bắt buộc trước khi lên production)
5. **Testing** — unit test service với mock repository, e2e test với `supertest`
6. **Transaction** — khi một thao tác cần ghi nhiều bảng cùng lúc
7. **Caching / Queue** — Redis, BullMQ

---

## Phụ lục: lệnh hay dùng

```bash
npm run start:dev          # chạy dev, tự reload khi sửa code
npm run build              # biên dịch TypeScript → dist/
npm run test               # unit test
npm run test:e2e           # test end-to-end

nest g resource orders     # sinh full module + controller + service + dto
nest g module orders       # chỉ sinh module
nest g service orders      # chỉ sinh service
```

Thử API nhanh:

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"name":"Clean Code","chapter":17}'

curl http://localhost:3000/api/books
curl http://localhost:3000/api/books/1
curl -X DELETE http://localhost:3000/api/books/1
```
