import { UpdateTransectionDto } from './dto/update-transections';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Transection } from 'src/entities/transection.entity';
import { Repository } from 'typeorm';
import { CreateTransectionDto } from './dto/create-transections';

@Injectable()
export class TransectionService {
  constructor(
    @InjectRepository(Transection)
    private readonly transectionRepository: Repository<Transection>,
  ) {}
  async create(
    createTransectionDto: CreateTransectionDto,
  ): Promise<Transection> {
    const category = await this.transectionRepository.findOne({
      where: { id: createTransectionDto.categoryId },
    });
    if (!category) {
      throw new Error(
        `Category with id ${createTransectionDto.categoryId} not found`,
      );
    }

    const transection = this.transectionRepository.create(createTransectionDto);
    return this.transectionRepository.save(transection);
  }

  async findAll(userId?: number): Promise<Transection[]> {
    return this.transectionRepository.find({
      where: userId ? { category: { user: { id: userId } } } : {},
      relations: { category: { user: true } },
    });
  }

  async findOne(id: number): Promise<Transection> {
    const transection = await this.transectionRepository.findOne({
      where: { id },
      relations: { category: true }, // trả về dữ liệu có categories
    });
    if (!transection) {
      throw new Error(`Transection with id ${id} not found`);
    }
    return transection;
  }

  async update(UpdateTransectionDto: UpdateTransectionDto): Promise<void> {
    const transection = await this.transectionRepository.findOne({
      where: { id: UpdateTransectionDto.id },
    });
    if (!transection) {
      throw new Error(
        `Transection with id ${UpdateTransectionDto.id} not found`,
      );
    }
    transection.amount = UpdateTransectionDto.amount;
    transection.description =
      UpdateTransectionDto.description ?? transection.description;
    await this.transectionRepository.save(transection);
  }

  async remove(id: number): Promise<void> {
    await this.transectionRepository.delete(id);
  }
}
