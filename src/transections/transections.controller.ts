import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { TransectionService } from './transections.service';
import { CreateTransectionDto } from './dto/create-transections';
import { UpdateTransectionDto } from './dto/update-transections';

@Controller('transections')
export class TransectionController {
  constructor(private readonly transectionService: TransectionService) {}
  @Post()
  create(@Body() createTransectionDto: CreateTransectionDto) {
    return this.transectionService.create(createTransectionDto);
  }

  @Post('update')
  update(@Body() updateTransectionDto: UpdateTransectionDto) {
    return this.transectionService.update(updateTransectionDto);
  }

  @Get()
  findAll(@Body() userId?: number) {
    return this.transectionService.findAll(userId);
  }

  @Get(':id')
  findOne(@Body() id: number) {
    return this.transectionService.findOne(id);
  }

  @Delete(':id')
  remove(@Body() id: number) {
    return this.transectionService.remove(id);
  }
}
