import { Module } from "@nestjs/common";
import { SaveController } from "./save.controller";
import { SaveService } from "./save.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Save } from "src/entities/save.entity";
import { SaveParticipant } from "src/entities/saveParticipant.entity";
import { User } from "src/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Save, SaveParticipant, User])],
  controllers: [SaveController],
  providers: [SaveService],
})
export class SaveModule {}
