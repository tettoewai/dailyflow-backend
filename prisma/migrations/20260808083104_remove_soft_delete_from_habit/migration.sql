/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Habit` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Habit` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,title]` on the table `Habit` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ChallengeHabit" DROP CONSTRAINT "ChallengeHabit_habitId_fkey";

-- DropForeignKey
ALTER TABLE "HabitAnalytics" DROP CONSTRAINT "HabitAnalytics_habitId_fkey";

-- DropForeignKey
ALTER TABLE "HabitCompletion" DROP CONSTRAINT "HabitCompletion_habitId_fkey";

-- DropForeignKey
ALTER TABLE "HabitTag" DROP CONSTRAINT "HabitTag_habitId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_habitId_fkey";

-- DropForeignKey
ALTER TABLE "ReminderLog" DROP CONSTRAINT "ReminderLog_reminderId_fkey";

-- DropIndex
DROP INDEX "Habit_userId_isDeleted_idx";

-- DropIndex
DROP INDEX "Habit_userId_title_isDeleted_key";

-- AlterTable
ALTER TABLE "Habit" DROP COLUMN "deletedAt",
DROP COLUMN "isDeleted";

-- CreateIndex
CREATE UNIQUE INDEX "Habit_userId_title_key" ON "Habit"("userId", "title");

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitTag" ADD CONSTRAINT "HabitTag_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitAnalytics" ADD CONSTRAINT "HabitAnalytics_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeHabit" ADD CONSTRAINT "ChallengeHabit_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
