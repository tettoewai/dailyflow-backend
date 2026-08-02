import { Module } from '@nestjs/common';
import { HabitService } from './habit.service';
import { PrismaService } from '@/prisma.service';
import { HabitController } from './habit.controller';

@Module({
  providers: [HabitService, PrismaService],
  exports: [HabitService],
  controllers: [HabitController],
})
export class HabitModule {}
