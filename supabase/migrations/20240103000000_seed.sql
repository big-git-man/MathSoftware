-- =====================================================================
-- PHASE 2/5: Seed data + server-side game logic
--   - level thresholds
--   - achievements
--   - missions (daily/weekly templates)
--   - default Mathematics curriculum function
--   - award_xp RPC (idempotent, recomputes level)
--   - streak tracking (log_activity + recompute_streak)
--   - lesson completions
--   - mission generation + advancement
--   - check_achievements RPC
-- =====================================================================

-- streak columns on user_progression
alter table public.user_progression
  add column if not exists current_streak int default 0,
  add column if not exists longest_streak int default 0,
  add column if not exists last_activity_date date;

-- ----------------------------------------------------------------------------
-- Level thresholds.
-- Increment to go from level L -> L+1 is (120 + 110 * L), so around the
-- example region (level 17 needs ~2000 XP for the next level).
-- cumulative_xp = total XP required to *reach* that level (level 1 = 0).
-- ----------------------------------------------------------------------------
insert into public.level_thresholds (level, cumulative_xp)
with RECURSIVE levels(l, inc, cum) as (
  select 1, 0 as inc, 0 as cum
  union all
  select l + 1,
         120 + 110 * (l + 1),
         cum + (120 + 110 * l)
  from levels
  where l < 60
)
select l, cum from levels;

-- ----------------------------------------------------------------------------
-- Lesson completions (marks a lesson as done for the student)
-- ----------------------------------------------------------------------------
create table public.lesson_completions (
  user_id     uuid references auth.users on delete cascade not null,
  lesson_id   uuid references public.lessons on delete cascade not null,
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);
create index lesson_completions_user_idx on public.lesson_completions (user_user_id); -- fix below
