import {
  CurrentUser,
  type JwtPayload,
} from '@/auth/decorators/current-user.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  Body,
  Controller,
  Delete,
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

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a habit' })
  @ApiParam({ name: 'id', description: 'Habit UUID' })
  @ApiResponse({ status: 200, description: 'Habit archived successfully' })
  @ApiResponse({ status: 404, description: 'Habit not found' })
  archiveHabit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) habitId: string,
  ) {
    return this.habitService.archiveHabit(user.sub, habitId);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive a habit' })
  @ApiParam({ name: 'id', description: 'Habit UUID' })
  @ApiResponse({ status: 200, description: 'Habit unarchived successfully' })
  @ApiResponse({ status: 404, description: 'Habit not found' })
  unarchiveHabit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) habitId: string,
  ) {
    return this.habitService.unarchiveHabit(user.sub, habitId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a habit' })
  @ApiParam({ name: 'id', description: 'Habit UUID' })
  @ApiResponse({ status: 200, description: 'Habit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Habit not found' })
  deleteHabit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) habitId: string,
  ) {
    return this.habitService.deleteHabit(user.sub, habitId);
  }
}
