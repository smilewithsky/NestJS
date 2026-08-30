import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Category } from '../entities/categories.entity';
import { User } from '../entities/user.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** POST /api/categories */
  async create(dto: CreateCategoryDto): Promise<Category> {
    const user = await this.userRepository.findOneBy({ id: dto.userId });

    // Bản cũ ném `new Error(...)` → Nest không hiểu, trả 500 "Internal server
    // error". NotFoundException mới ra đúng 404 kèm JSON đọc được.
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user id = ${dto.userId}`);
    }

    await this.ensureNameIsFree(dto.userId, dto.name);

    const category = this.categoryRepository.create({
      name: dto.name,
      type: dto.type,
      user,
    });

    return this.categoryRepository.save(category);
  }

  /**
   * GET /api/categories?userId=1
   *
   * Không truyền userId thì trả về TẤT CẢ — tiện lúc dev, nhưng đây chính
   * là chỗ sẽ phải siết lại ở Mốc 5: khi có auth thì userId luôn lấy từ
   * token, và route "xem hết của mọi người" phải biến mất.
   */
  async findAll(userId?: number): Promise<Category[]> {
    return this.categoryRepository.find({
      where: userId ? { user: { id: userId } } : {},
      // Không có dòng này thì mỗi category trả về sẽ KHÔNG kèm user
      // (TypeORM mặc định không JOIN quan hệ) → FE không biết ai sở hữu.
      relations: { user: true },
      order: { id: 'ASC' },
    });
  }

  /** GET /api/categories/:id */
  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!category) {
      throw new NotFoundException(`Không tìm thấy category id = ${id}`);
    }
    return category;
  }

  /** PATCH /api/categories/:id */
  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id); // tự động 404 nếu không có

    // Chỉ kiểm tra trùng khi tên THỰC SỰ đổi — nếu không, lưu lại chính nó
    // với tên cũ cũng sẽ bị chặn 409, một lỗi kinh điển của kiểu check này.
    if (dto.name && dto.name !== category.name) {
      await this.ensureNameIsFree(category.user.id, dto.name, id);
    }

    Object.assign(category, dto);

    return this.categoryRepository.save(category);
  }

  /** DELETE /api/categories/:id */
  async remove(id: number): Promise<void> {
    const result = await this.categoryRepository.delete(id);

    // delete() không ném lỗi khi id không tồn tại — chỉ trả affected = 0.
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy category id = ${id}`);
    }
  }

  /**
   * Tên category phải là DUY NHẤT TRONG PHẠM VI MỘT USER — hai người khác
   * nhau đều có quyền có "Ăn uống" của riêng mình.
   *
   * `exceptId` dùng lúc update: bỏ chính bản ghi đang sửa ra khỏi phép so.
   *
   * Lưu ý: đây là check ở tầng ứng dụng nên vẫn hở race condition (2 request
   * cùng lúc). Chốt cuối đúng bài là một UNIQUE index (user_id, name) ở DB.
   */
  private async ensureNameIsFree(
    userId: number,
    name: string,
    exceptId?: number,
  ): Promise<void> {
    const existed = await this.categoryRepository.findOne({
      where: {
        name,
        user: { id: userId },
        ...(exceptId ? { id: Not(exceptId) } : {}),
      },
    });

    if (existed) {
      throw new ConflictException(`Category "${name}" đã tồn tại`);
    }
  }
}
