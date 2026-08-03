import { Module } from '@nestjs/common';
import { HabitController } from './habit.controller';
import { HabitService } from './habit.service';
import { DeletedHabitCleanService } from './deleted-habit-clean.service';

@Module({
  providers: [HabitService, DeletedHabitCleanService],
  exports: [HabitService],
  controllers: [HabitController],
})
export class HabitModule {}
