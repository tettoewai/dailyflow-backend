import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { FrequencyType, HabitUnit } from '../../generated/prisma/enums';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated-response.dto';
import { Habit } from '../../generated/prisma/browser';

@Injectable()
export class HabitService {
  constructor(private readonly prisma: PrismaService) {}

  async getHabit(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Habit>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.habit.findMany({
        where: { userId, isDeleted: false, isArchived: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.habit.count({
        where: { userId, isDeleted: false, isArchived: false },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        total,
        limit,
        totalPages: total,
      },
    };
  }

  async createHabit(userId: string, body: CreateHabitDto) {
    // 1. Duplicate title check
    const existingHabit = await this.prisma.habit.findFirst({
      where: { userId, isDeleted: false, title: body.title },
      select: { id: true },
    });

    if (existingHabit) {
      throw new BadRequestException(
        `Habit with title "${body.title}" already exists.`,
      );
    }

    // 2. Validate conditional requirements
    if (body.frequencyType === FrequencyType.WEEKLY && !body.selectedDays) {
      throw new BadRequestException(
        'Selected days are required for weekly habits.',
      );
    }

    if (body.frequencyType === FrequencyType.CUSTOM && !body.customSchedule) {
      throw new BadRequestException(
        'Custom schedule is required for custom frequency',
      );
    }

    // 3. Prepare habit data (parse customSchedule if provided)
    const habitData: any = {
      userId,
      title: body.title,
      description: body.description,
      icon: body.icon,
      color: body.color,
      frequencyType: body.frequencyType ?? FrequencyType.DAILY,
      target: body.target ?? 1,
      unit: body.unit ?? HabitUnit.TIMES,
      selectedDays: body.selectedDays,
      categoryId: body.categoryId,
      customSchedule: body.customSchedule,
    };

    // 4. Check if tags exist (if provided)
    if (body.tagIds && body.tagIds.length) {
      const foundTags = await this.prisma.tag.findMany({
        where: { id: { in: body.tagIds } },
        select: { id: true },
      });

      if (foundTags.length !== body.tagIds.length) {
        const foundIds = new Set(foundTags.map((t) => t.id));
        const missing = body.tagIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(
          `Tags with IDs [${missing.join(', ')}] not found.`,
        );
      }
    }

    // 5. Create habit and tags in a transaction
    const newHabit = await this.prisma.$transaction(async (tx) => {
      // Create habit
      const habit = await tx.habit.create({
        data: habitData,
        select: { id: true, title: true, icon: true, color: true },
      });

      // Create habit-tag links if any
      if (body.tagIds && body.tagIds.length) {
        await tx.habitTag.createMany({
          data: body.tagIds.map((tagId) => ({
            habitId: habit.id,
            tagId,
          })),
        });
      }

      return habit;
    });

    // 6. Return created habit
    return newHabit;
  }
}
