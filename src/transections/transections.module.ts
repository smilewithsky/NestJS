import { Module } from '@nestjs/common';
import { TransectionController } from './transections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transection } from 'src/entities/transection.entity';
import { TransectionService } from './transections.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transection])],
  controllers: [TransectionController],
  providers: [TransectionService],
})
export class TransectionsModule {}
