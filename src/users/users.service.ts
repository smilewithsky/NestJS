import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../entities/user.entity';

/**
 * SERVICE (PROVIDER) = nơi chứa LOGIC NGHIỆP VỤ.
 *
 * Nguyên tắc quan trọng nhất: service KHÔNG BIẾT GÌ về HTTP.
 * Không có req, không có res, không có status code.
 * Nhờ vậy sau này bạn gọi lại nó từ CLI, cron job, hay message queue đều được.
 *
 * @Injectable() → đánh dấu "class này quản lý bởi DI container của Nest",
 * để Nest có thể tạo nó và tiêm vào chỗ khác.
 */
@Injectable()
export class UsersService {
  /**
   * @InjectRepository(User) tiêm vào "Repository của bảng users".
   * Repository là object TypeORM cung cấp sẵn các hàm truy vấn:
   *   find, findOne, save, delete, count...
   *
   * Repository này tồn tại được là nhờ dòng
   *   TypeOrmModule.forFeature([User])
   * trong users.module.ts. Thiếu dòng đó → Nest báo lỗi
   * "Nest can't resolve dependencies of the UsersService".
   *
   * `private` trong constructor là cú pháp tắt của TypeScript:
   * vừa khai báo tham số, vừa tự gán thành this.usersRepository.
   */
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /** POST /api/users — tạo mới */
  async create(dto: CreateUserDto): Promise<User> {
    // Kiểm tra trùng email TRƯỚC, để trả lỗi 409 dễ hiểu cho client.
    // (DB vẫn có UNIQUE index làm lớp chặn cuối, phòng trường hợp
    //  2 request vào cùng lúc — race condition)
    const existed = await this.usersRepository.findOneBy({ email: dto.email });
    if (existed) {
      throw new ConflictException(`Email ${dto.email} đã được sử dụng`);
    }

    // create() chỉ tạo object trong bộ nhớ, CHƯA chạm vào DB.
    const user = this.usersRepository.create({
      ...dto,
      age: dto.age ?? null,
    });

    // save() mới thực sự chạy câu INSERT và trả về bản ghi kèm id.
    return this.usersRepository.save(user);
  }

  /** GET /api/users — lấy danh sách */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { id: 'ASC' },
    });
  }

  /** GET /api/users/:id — lấy 1 bản ghi */
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    // Vì tsconfig bật strictNullChecks, TypeScript BẮT bạn xử lý case null.
    // Ném NotFoundException → Nest tự trả HTTP 404 kèm JSON chuẩn.
    // Đây là cách service "báo lỗi" mà vẫn không cần biết gì về HTTP:
    // nó chỉ ném exception, Nest lo phần dịch sang status code.
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user id = ${id}`);
    }
    return user;
  }

  /** PATCH /api/users/:id — sửa một phần */
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // tái dùng luôn, tự động 404 nếu không có

    // Đổi sang email của người khác thì UNIQUE index bên Postgres sẽ ném lỗi
    // driver → Nest không hiểu → 500. Check trước để ra 409 đọc được.
    // So sánh `!== user.email` để việc lưu lại chính email cũ không bị chặn.
    if (dto.email && dto.email !== user.email) {
      const existed = await this.usersRepository.findOneBy({
        email: dto.email,
      });
      if (existed) {
        throw new ConflictException(`Email ${dto.email} đã được sử dụng`);
      }
    }

    // Object.assign chỉ ghi đè những field client thực sự gửi lên.
    Object.assign(user, dto);

    return this.usersRepository.save(user);
  }

  /* ───────────── Dùng cho AuthModule ─────────────
   * Đây là các truy vấn thuần dữ liệu. Logic "đăng nhập đúng/sai",
   * "băm mật khẩu", "ký token" KHÔNG nằm ở đây mà ở AuthService —
   * UsersService chỉ biết đọc/ghi bảng users.
   */

  /**
   * Giống findOne nhưng trả null thay vì ném 404.
   * JwtStrategy cần bản này: token hợp lệ nhưng user đã bị xoá
   * thì phải trả 401 (chưa đăng nhập) chứ không phải 404.
   */
  async findByIdOrNull(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  /**
   * Lấy user KÈM cột password.
   * Vì entity khai báo `select: false`, findOneBy sẽ luôn trả về
   * user.password === undefined. Muốn có hash để so sánh lúc đăng nhập
   * thì phải xin thêm bằng addSelect như dưới đây.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ googleId });
  }

  /** Tạo user từ dữ liệu đã được AuthService chuẩn bị sẵn (password đã băm). */
  async createAccount(data: Partial<User>): Promise<User> {
    return this.usersRepository.save(this.usersRepository.create(data));
  }

  /** Lưu lại thay đổi trên một user đã có (dùng khi liên kết tài khoản Google). */
  async persist(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  /** DELETE /api/users/:id — xoá */
  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);

    // delete() không ném lỗi khi id không tồn tại — nó chỉ trả affected = 0.
    // Nên phải tự kiểm tra để trả 404 cho đúng.
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy user id = ${id}`);
    }
  }
}
