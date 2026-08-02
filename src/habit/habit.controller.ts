import {
  CurrentUser,
  type JwtPayload,
} from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { HabitService } from './habit.service';

@Controller('habit')
export class HabitController {
  constructor(private readonly habitService: HabitService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getHabit(@CurrentUser() user: JwtPayload) {
    return this.habitService.getHabit(user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createHabit(@CurrentUser() user: JwtPayload, @Body() body: CreateHabitDto) {
    return this.habitService.createHabit(user.sub, body);
  }
}
