import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Save } from "./save.entity";

@Entity("save_participant")
export class SaveParticipant {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.saveParticipants, {
    onDelete: "CASCADE",
  })
  user!: User;

  @ManyToOne(() => Save, (save) => save.saveParticipants, {
    onDelete: "CASCADE",
  })
  save!: Save;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  joinedAt!: Date;
}
