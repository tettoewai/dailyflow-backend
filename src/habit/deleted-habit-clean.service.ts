import { PrismaService } from '@/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DeletedHabitCleanService {
  private readonly logger = new Logger(DeletedHabitCleanService.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDeletedHabits() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // Delete deleted habits that were created more than 30 days ago
      const deleted = await this.prisma.habit.deleteMany({
        where: { isDeleted: true, updatedAt: { lt: thirtyDaysAgo } },
      });
      this.logger.log(`🧹 Cleaned up ${deleted.count} deleted habits`);
    } catch (error) {
      this.logger.error('Error cleaning up deleted habits:', error);
    }
  }
}
