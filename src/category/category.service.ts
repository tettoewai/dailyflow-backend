import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(CategoryService.name);

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

    try {
      const newCategory = await this.prisma.category.create({
        data: { userId, name: body.name, icon: body.icon, color: body.color },
        select: { id: true, name: true },
      });
      return {
        message: 'Category created successfully',
        success: true,
        data: newCategory,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to create category');
    }
  }
}
