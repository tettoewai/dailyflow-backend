import { Module } from '@nestjs/common';
import { HabitController } from './habit.controller';
import { HabitService } from './habit.service';

@Module({
  providers: [HabitService],
  exports: [HabitService],
  controllers: [HabitController],
})
export class HabitModule {}
