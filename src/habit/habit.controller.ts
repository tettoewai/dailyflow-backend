import {
  CurrentUser,
  type JwtPayload,
} from '@/auth/decorators/current-user.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { HabitService } from './habit.service';

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update a habit' })
  @ApiParam({ name: 'id', description: 'Habit UUID' })
  @ApiResponse({ status: 200, description: 'Habit updated successfully' })
  @ApiResponse({ status: 404, description: 'Habit not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  updateHabit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) habitId: string,
    @Body() body: UpdateHabitDto,
  ) {
    return this.habitService.updateHabit(user.sub, habitId, body);
  }
}
