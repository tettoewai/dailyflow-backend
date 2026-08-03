import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { FrequencyType, HabitUnit } from '../../generated/prisma/enums';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated-response.dto';
import { Habit } from '../../generated/prisma/browser';
import { UpdateHabitDto } from './dto/update-habit.dto';

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

  async updateHabit(userId: string, habitId: string, body: UpdateHabitDto) {
    // 1. Verify habit exists and belong to user
    const existingHabit = await this.prisma.habit.findUnique({
      where: { id: habitId, userId, isDeleted: false, isArchived: false },
      select: {
        id: true,
        title: true,
        frequencyType: true,
        customSchedule: true,
        selectedDays: true,
      },
    });

    if (!existingHabit) {
      throw new NotFoundException('Habit not found');
    }

    // 2. Duplicate tital check (only if title is being changed)
    if (body.title && body.title !== existingHabit.title) {
      const duplicate = await this.prisma.habit.findFirst({
        where: {
          title: body.title,
          userId,
          isDeleted: false,
          isArchived: false,
          id: { not: habitId },
        },
      });
      if (duplicate) {
        throw new BadRequestException(
          `Habit with title "${body.title}" already exists`,
        );
      }
    }

    //3. Validate conditonal requirements (only if relvent fields change)
    const frequencyType = body.frequencyType ?? existingHabit.frequencyType;

    if (
      frequencyType === FrequencyType.WEEKLY &&
      body.selectedDays === undefined &&
      !existingHabit.selectedDays
    ) {
      throw new BadRequestException(
        'Selected days are required for weekly frequency',
      );
    }

    if (
      frequencyType === FrequencyType.CUSTOM &&
      body.customSchedule === undefined &&
      !existingHabit.customSchedule
    ) {
      throw new BadRequestException(
        'Custom schedule is required for custom frequency',
      );
    }

    // 4. Handle tag update (if provided)
    if (body.tagIds !== undefined) {
      // Fetch current tags
      const currentTags = await this.prisma.habitTag.findMany({
        where: { habitId },
        select: { tagId: true },
      });
      const currentTagIds = currentTags.map((t) => t.tagId).sort();
      const incomingTagIds = [...body.tagIds].sort();

      // Only update if actually changed
      const hasChanged =
        currentTagIds.length !== incomingTagIds.length ||
        currentTagIds.some((id, i) => id !== incomingTagIds[i]);

      if (hasChanged) {
        // Validate all incoming tags exist
        if (body.tagIds.length) {
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

        // Replace all
        await this.prisma.habitTag.deleteMany({ where: { habitId } });

        if (body.tagIds.length) {
          await this.prisma.habitTag.createMany({
            data: body.tagIds.map((tagId) => ({ habitId, tagId })),
          });
        }
      }
    }

    // 5. Update habit (only provided fields)
    const updated = await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && {
          description: body.description ?? null,
        }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.frequencyType !== undefined && {
          frequencyType: body.frequencyType,
        }),
        ...(body.target !== undefined && { target: body.target }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.customSchedule !== undefined && {
          customSchedule: body.customSchedule ?? null,
        }),
        ...(body.selectedDays !== undefined && {
          selectedDays: body.selectedDays,
        }),
        ...(body.categoryId !== undefined && {
          categoryId: body.categoryId ?? null,
        }),
      },
      select: { id: true, title: true },
    });
    return updated;
  }
}
