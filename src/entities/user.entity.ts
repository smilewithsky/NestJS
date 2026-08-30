import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './categories.entity';

@Entity('users')
export class User {
  /**
   * Khoá chính, tự tăng.
   * Postgres sẽ tạo cột kiểu SERIAL/IDENTITY.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * @Column() = 1 cột thường.
   * TypeORM suy ra kiểu SQL từ kiểu TypeScript (string → varchar),
   * nhờ "emitDecoratorMetadata": true trong tsconfig.json.
   * length: 100 → varchar(100)
   */
  @Column({ length: 100 })
  name!: string;

  /**
   * unique: true → tạo UNIQUE INDEX ở DB.
   * Đây là lớp chặn CUỐI CÙNG (ở tầng database).
   * Việc kiểm tra "email đã tồn tại chưa" cho ra lỗi đẹp
   * vẫn nên làm ở service — xem users.service.ts.
   */
  @Column({ unique: true })
  email!: string;

  /**
   * nullable: true → cột cho phép NULL.
   * Vì tsconfig bật strictNullChecks, kiểu TS phải là `number | null`
   * cho khớp với thực tế dữ liệu.
   */
  @Column({ type: 'int', nullable: true })
  age?: number | null;

  /**
   * MẬT KHẨU ĐÃ BĂM (bcrypt hash) — KHÔNG BAO GIỜ lưu mật khẩu gốc.
   *
   * `select: false` là điểm quan trọng nhất ở đây: mặc định TypeORM sẽ
   * KHÔNG lấy cột này ra. Nghĩa là mọi `find()` cũ (GET /api/users...)
   * tự động an toàn, không lỡ tay trả hash về cho client.
   * Muốn lấy ra phải xin rõ ràng:
   *   .createQueryBuilder('u').addSelect('u.password')
   *
   * nullable vì user đăng nhập bằng Google thì không có mật khẩu.
   */
  @Column({ type: 'varchar', nullable: true, select: false })
  password?: string | null;

  /**
   * ID người dùng bên Google ("sub" trong token của Google) — định danh
   * ổn định, KHÔNG đổi kể cả khi user đổi email. Vì vậy nó là khoá để
   * nhận ra "vẫn là người này" ở các lần đăng nhập sau.
   */
  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId?: string | null;

  /** Ảnh đại diện Google trả về — chỉ để hiển thị. */
  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string | null;

  /**
   * @CreateDateColumn / @UpdateDateColumn:
   * TypeORM TỰ điền thời gian lúc insert / lúc update.
   * Bạn không bao giờ phải gán tay 2 field này.
   *
   * name: 'created_at' → trong DB cột tên snake_case,
   * trong code vẫn dùng camelCase createdAt.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Category, (category) => category.user, { cascade: true })
  categories!: Category[];
}
