import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { FrequencyType, HabitUnit } from '../../generated/prisma/enums';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated-response.dto';
import { Habit } from '../../generated/prisma/browser';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { ActionResponse } from '@/common/dto/action-response.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class HabitService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(HabitService.name);

  async getHabit(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Habit>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.habit.findMany({
        where: { userId, isArchived: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.habit.count({
        where: { userId, isArchived: false },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        total,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createHabit(
    userId: string,
    body: CreateHabitDto,
  ): Promise<
    ActionResponse<{ id: string; title: string; icon: string; color: string }>
  > {
    // Validate conditional requirements
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

    // Prepare habit data (parse customSchedule if provided)
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

    // Check if tags exist (if provided)
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

    try {
      // Create habit and tags in a transaction
      const newHabit = await this.prisma.$transaction(async (tx) => {
        const habit = await tx.habit.create({
          data: habitData,
          select: {
            id: true,
            title: true,
            icon: true,
            color: true,
          },
        });

        if (body.tagIds?.length) {
          await tx.habitTag.createMany({
            data: body.tagIds.map((tagId) => ({
              habitId: habit.id,
              tagId,
            })),
          });
        }

        return habit;
      });

      // Return created habit
      return {
        message: 'Habit created successfully',
        success: true,
        data: newHabit,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(`Habit "${body.title}" already exists.`);
      }

      this.logger.error(error);
      throw new InternalServerErrorException('Failed to create habit');
    }
  }

  async updateHabit(userId: string, habitId: string, body: UpdateHabitDto) {
    // 1. Verify habit exists and belong to user
    const existingHabit = await this.prisma.habit.findUnique({
      where: { id: habitId, userId, isArchived: false },
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

    // 2. Duplicate title check (only if title is being changed)
    if (body.title && body.title !== existingHabit.title) {
      const duplicate = await this.prisma.habit.findFirst({
        where: {
          title: body.title,
          userId,
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

    //3. Validate conditional requirements (only if relevent fields change)
    const frequencyType = body.frequencyType ?? existingHabit.frequencyType;

    if (
      frequencyType === FrequencyType.WEEKLY &&
      body.selectedDays === undefined &&
      !(existingHabit.selectedDays && existingHabit.selectedDays.length > 0)
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

    const updated = await this.prisma.$transaction(async (tx) => {
      // 4. Handle tag update (if provided)
      if (body.tagIds !== undefined) {
        // Fetch current tags
        const currentTags = await tx.habitTag.findMany({
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
            const foundTags = await tx.tag.findMany({
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
          await tx.habitTag.deleteMany({ where: { habitId } });

          if (body.tagIds.length) {
            await tx.habitTag.createMany({
              data: body.tagIds.map((tagId) => ({ habitId, tagId })),
            });
          }
        }
      }

      // 5. Update habit (only provided fields)
      return await tx.habit.update({
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
    });
    return {
      message: 'Habit updated successfully',
      success: true,
      data: updated,
    };
  }

  async archiveHabit(
    userId: string,
    habitId: string,
  ): Promise<ActionResponse<{ id: string; title: string }>> {
    // 1. Verify habit exists and belongs to user
    const existingHabit = await this.prisma.habit.findUnique({
      where: { id: habitId, userId, isArchived: false },
      select: { id: true, title: true },
    });

    if (!existingHabit) {
      throw new NotFoundException('Habit not found');
    }

    // 2. Archive habit
    await this.prisma.habit.update({
      where: { id: habitId },
      data: { isArchived: true, archivedAt: new Date() },
    });

    return {
      message: 'Habit archived successfully',
      success: true,
      data: existingHabit,
    };
  }

  async unarchiveHabit(
    userId: string,
    habitId: string,
  ): Promise<ActionResponse<{ id: string; title: string }>> {
    // 1. Verify habit exists and belongs to user
    const existingHabit = await this.prisma.habit.findUnique({
      where: { id: habitId, userId, isArchived: true },
      select: { id: true, title: true },
    });

    if (!existingHabit) {
      throw new NotFoundException('Habit not found');
    }

    // 2. Archive habit
    await this.prisma.habit.update({
      where: { id: habitId },
      data: { isArchived: false },
    });

    return {
      message: 'Habit unarchived successfully',
      success: true,
      data: existingHabit,
    };
  }

  async deleteHabit(
    userId: string,
    habitId: string,
  ): Promise<ActionResponse<{ id: string; title: string }>> {
    // 1. Verify habit exists and belongs to user
    const existingHabit = await this.prisma.habit.findUnique({
      where: { id: habitId, userId, isArchived: false },
      select: { id: true, title: true },
    });

    if (!existingHabit) {
      throw new NotFoundException('Habit not found');
    }

    // 2. Delete habit
    await this.prisma.habit.delete({
      where: { id: habitId },
    });

    return {
      message: 'Habit deleted successfully',
      success: true,
      data: existingHabit,
    };
  }
}
