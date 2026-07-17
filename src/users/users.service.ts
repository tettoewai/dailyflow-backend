import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    try {
      return this.prisma.user.findFirst({
        where: {
          email,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async findById(id: string) {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }
    try {
      return this.prisma.user.findUnique({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async getUserProfile(id: string) {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }
    try {
      return this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          isGuest: true,
          xp: true,
          currentStreak: true,
          longestStreak: true,
          level: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async create(email: string, password: string, name: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      return this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashed = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
    return {
      id: user.id,
      refreshToken: user.refreshToken,
    };
  }
}
