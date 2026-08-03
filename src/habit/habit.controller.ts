import {
  CurrentUser,
  type JwtPayload,
} from '@/auth/decorators/current-user.decorator';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { HabitService } from './habit.service';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('habit')
export class HabitController {
  constructor(private readonly habitService: HabitService) {}

  @Get()
  getHabit(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.habitService.getHabit(user.sub, pagination);
  }

  @Post()
  createHabit(@CurrentUser() user: JwtPayload, @Body() body: CreateHabitDto) {
    return this.habitService.createHabit(user.sub, body);
  }
}
