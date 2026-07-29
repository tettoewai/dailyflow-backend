import { PrismaService } from '@/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class GuestCleanUpService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(GuestCleanUpService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupGuestUsers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // Delete guest users who haven't been active for 30 days
      const deleted = await this.prisma.user.deleteMany({
        where: {
          isGuest: true,
          lastActiveAt: {
            lt: thirtyDaysAgo,
          },
          habits: {
            none: {},
          },
        },
      });
      this.logger.log(`🧹 Cleaned up ${deleted.count} inactive guest accounts`);
    } catch (error) {
      this.logger.error('Error cleaning up guest users:', error);
    }
  }
}
