import { Module } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { CategoriesService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from 'src/entities/categories.entity';
import { Transection } from 'src/entities/transection.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Category, User, Transection])],
  controllers: [CategoryController],
  providers: [CategoriesService],
})
export class CategoryModule {}
