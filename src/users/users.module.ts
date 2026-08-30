import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  // AuthModule cần UsersService để tìm/tạo user → phải export ra ngoài.
  // Không có dòng này, Nest báo "can't resolve dependencies of AuthService".
  exports: [UsersService],
})
export class UsersModule {}
