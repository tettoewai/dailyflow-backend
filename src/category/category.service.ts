import { PrismaService } from '@/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategory(userId: string) {
    return await this.prisma.category.findMany({ where: { userId } });
  }

  async createCategory(userId: string, body: CreateCategoryDto) {
    // 1. Check unique name for specific user
    const existing = await this.prisma.category.findFirst({
      where: { userId, name: body.name },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        `Category with name "${body.name}" already exists`,
      );
    }
  }
}
