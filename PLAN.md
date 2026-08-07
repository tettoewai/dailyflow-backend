# DailyFlow Backend Plan

Aligned with the mobile roadmap in `../dailyflow/README.md`.
Current status reflects the state of `src/` and `prisma/schema.prisma`.

## Current state

**Implemented**

- Auth: login, register, guest, logout, refresh, convert-guest (JWT + refresh strategies, throttling).
- User: profile read.
- Habit: list (paginated), create, update, archive/unarchive, delete (soft delete), duplicate-title guard.
- Prisma schema defines the full data model (far ahead of implementation).

**Incomplete / buggy**

- No `Tag` module/service despite `habit.tagIds` support.
- No completions, streak engine, XP, reminders, achievements, analytics, notifications, preferences, premium, social, or challenges implemented.

---

## Roadmap (prioritized) with mobile feature mapping

### Phase 1 — Core habit loop (critical for mobile "Current" features)

Mobile: Track daily completion, Streak tracking, Daily progress overview.

- [ ] **Completions module**
  - `POST /habit/:id/completions` (record, multi-unit value)
  - `DELETE /habit/:id/completions/:completionId` (undo, respects `isUndone`)
  - Update `currentStreak` / `longestStreak` / `lastCompletedAt`, award XP.
  - Use Prisma transactions (completion + streak + XP + daily summary).
- [ ] **Streak engine** (shared service)
  - Compute current/longest streak on the fly.
- [ ] **XP & leveling**
  - `XPTransaction` ledger, `UserLevel` thresholds, level-up transition.
- [ ] **Daily summary + calendar** (mobile: Calendar-based history)
  - `@nestjs/schedule` daily upsert of `DailySummary`; endpoints for daily history (heatmap data).

### Phase 2 — Finish existing features & mobile roadmap items

Mobile roadmap: Habit Categories.

- [ ] **Categories** full CRUD + correct route; block delete when habits reference it.
- [ ] **Tags** create/update/list/delete (`HabitTag` mapping already handled in habit news cycle).
- [ ] **Profile update** (PATCH name/avatar/timezone) + `UserPreference` (language, default view, weekStartsOn, notifications toggles).

### Phase 3 — Statistics dashboard & heatmap (mobile roadmap)

Mobile: Statistics Dashboard, Heatmap Calendar.

- [ ] **Analytics** module — `HabitAnalytics` + `UserAnalytics` aggregation (best day/hour, rates, trends, productive periods).
- [ ] **Dashboard endpoint** — today's progress, habit list w/ completion state, XPs, level, streaks.
- [ ] **Heatmap data endpoint** — grouped completion history by day for the calendar heatmap.

### Phase 4 — Reminders & notifications (mobile "Current")

Mobile: Reminder notifications.

- [ ] **Reminder CRUD** per habit (hour, minute, days, smart window).
- [ ] **Notification inbox** — list, mark-read, deep-link action.
- [ ] **Reminder scheduler** — `@nestjs/schedule` + optional push (via FCM/APNs hook) creating `Notification`/`ReminderLog` rows.

### Phase 5 — Achievements & gamification (mobile roadmap)

Mobile: Achievement System, XP and leveling.

- [ ] **Achievements** — seed definitions, rule evaluation on completion/streak events, grant `UserAchievement` + XP.
- [ ] **Achievement share** — `SharedAchievement` create + likes.

### Phase 6 — Premium & backup (mobile roadmap)

Mobile: Cloud Backup, Cloud synchronization.

- [ ] **Premium subscription** — Stripe (checkout / webhook), feature gating (habit limits, streak freeze).
- [ ] **Backup / restore** — export/import JSON, storage hook.

### Phase 7 — Social & challenges (mobile roadmap)

Mobile: Social challenges.

- [ ] **Social** — follow/accept/block, feeds/activity timeline.
- [ ] **Challenges** — create/join/progress/completion rewards.

> Offline sync, AI habit coach, and Wear OS / Watch support are largely **client-side** concerns; backend support (complex offline merge + AI recommendation endpoint) is optional later.

---

## Architecture notes

- One Nest module per feature (controller + service + dto), mirroring `habit`/`auth`.
- Centralize streak + XP + achievement rules in a shared `GameService` used by both the completions endpoint and the daily scheduler, to avoid duplicating logic.
- Use Prisma transactions for multi-write operations (completion → streak → XP → daily summary).
- Enforce ownership scoping through `@CurrentUser()` everywhere (existing pattern).
- Keep OpenAPI/Swagger annotations on every endpoint (existing pattern).
