-- =====================================================================
-- PHASE 2: Core schema + Row Level Security
-- Every table that holds user data carries a user_id and is locked down
-- by RLS so the database itself enforces privacy.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- profiles: extends auth.users with per-student metadata (single-user app, but
-- architected so additional users could be added later).
-- ----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url   text,
  timezone     text default 'UTC',
  locale       text default 'en',
  onboarding_completed boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Curriculum hierarchy (fully data-driven, not hard-coded in the app).
-- Subject -> Course -> Unit -> Topic -> Lesson
-- ----------------------------------------------------------------------------
create table public.subjects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  description  text,
  icon         text,
  color        text,
  position     int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  subject_id   uuid references public.subjects on delete cascade not null,
  name         text not null,
  description  text,
  position     int default 0,
  metadata     jsonb default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table public.units (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  course_id    uuid references public.courses on delete cascade not null,
  name         text not null,
  description  text,
  position     int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table public.topics (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  unit_id      uuid references public.units on delete cascade not null,
  name         text not null,
  description  text,
  position     int default 0,
  color        text,
  difficulty   text, -- easy, medium, hard
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete cascade not null,
  topic_id         uuid references public.topics on delete cascade not null,
  title            text not null,
  content          text,            -- markdown / rich text
  position         int default 0,
  duration_minutes int,
  metadata         jsonb default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Tags
-- ----------------------------------------------------------------------------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  color      text,
  created_at timestamptz default now()
);
create unique index tags_user_name_idx on public.tags (user_id, lower(name));

-- ----------------------------------------------------------------------------
-- Assignments (homework, classwork, tests, exams, etc.)
-- A single assignment may own many documents (multi-page / multi-photo homework)
-- ----------------------------------------------------------------------------
create type public.assignment_type as enum ('homework','classwork','worksheet','test','exam','revision','notes','other');
create type public.assignment_status as enum ('draft','pending','in_progress','completed','archived');

create table public.assignments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  name          text not null,
  course_id     uuid references public.courses,
  unit_id       uuid references public.units,
  topic_id      uuid references public.topics,
  type          public.assignment_type not null,
  due_date      timestamptz,
  due_date_end  timestamptz,
  status        public.assignment_status default 'pending',
  metadata      jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Documents (binary files live in private Storage; DB holds metadata only)
create type public.document_type as enum ('homework','classwork','worksheet','test','exam','revision','notes','other');
create type public.processing_status as enum ('uploading','processing','ocr','analyzing','ready','failed');

create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  original_filename text not null,
  storage_bucket  text not null default 'documents',
  storage_path    text not null,          -- user/{uid}/documents/{did}/original
  thumbnail_path  text,                   -- user/{uid}/documents/{did}/thumbnail
  mime_type       text not null,
  extension       text,
  file_size       bigint,
  width           int,
  height          int,
  page_count      int,
  upload_date     date default current_date,
  document_type   public.document_type not null,
  subject_id      uuid references public.subjects,
  course_id       uuid references public.courses,
  unit_id         uuid references public.units,
  topic_id        uuid references public.topics,
  assignment_id   uuid references public.assignments,
  ai_title        text,
  ai_summary      text,
  ai_difficulty   text,
  ai_classification jsonb default '{}',
  ocr_text        text,
  ocr_locale      text,
  processing_status public.processing_status default 'ready',
  is_favorite     boolean default false,
  captured_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index documents_user_created_idx on public.documents (user_id, created_at desc);
create index documents_status_idx        on public.documents (user_id, processing_status);
create index documents_ocr_gin           on public.documents using gin (to_tsvector('english', coalesce(ocr_text,'')));
create index documents_topic_idx         on public.documents (topic_id) where topic_id is not null;
create index documents_assignment_idx    on public.documents (assignment_id) where assignment_id is not null;

-- Link assignments to their documents after both parent tables exist.
create table public.assignment_documents (
  assignment_id uuid references public.assignments on delete cascade not null,
  document_id   uuid references public.documents on delete cascade not null,
  sort_order    int default 0,
  primary key (assignment_id, document_id)
);

-- multi-page PDF / multi-shot page breakdown for viewing
create table public.document_pages (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents on delete cascade not null,
  user_id     uuid references auth.users on delete cascade not null,
  page_number int not null,
  thumbnail_path text,
  width       int,
  height      int,
  primary key (document_id, page_number)
);

-- document <-> tag
create table public.document_tags (
  document_id uuid references public.documents on delete cascade not null,
  tag_id      uuid references public.tags on delete cascade not null,
  primary key (document_id, tag_id)
);

-- ----------------------------------------------------------------------------
-- Document processing jobs (background pipeline: OCR / AI / thumbnails)
-- ----------------------------------------------------------------------------
create table public.document_processing_jobs (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references public.documents on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  status       text not null default 'pending',   -- pending, uploading, processing, ocr, analyzing, ready, failed
  stage        text,                              -- current pipeline stage
  started_at   timestamptz,
  completed_at timestamptz,
  error        text,
  attempts     int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index processing_jobs_user_status on public.document_processing_jobs (user_id, status);
create index processing_jobs_doc_idx     on public.document_processing_jobs (document_id);

-- ----------------------------------------------------------------------------
-- Practice questions (curated library; user_id null = templated/shared base)
-- ----------------------------------------------------------------------------
create type public.difficulty_level as enum ('easy','medium','hard');

create table public.practice_questions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete cascade,        -- null = shared bank
  topic_id         uuid references public.topics on delete cascade,
  course_id        uuid references public.courses on delete cascade,
  difficulty       public.difficulty_level,
  question         text not null,
  correct_answer   text,
  answer_type      text,            -- text, number, expression, multiple_choice, multi_select, equation
  options          jsonb,           -- [{label, value, correct}]
  explanation      text,
  solution_steps   jsonb,
  skills_tested    text[],
  source_document_id uuid references public.documents,
  metadata         jsonb default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index practice_questions_topic_idx on public.practice_questions (user_id, topic_id, difficulty);

-- ----------------------------------------------------------------------------
-- Question attempts (every interaction is tracked)
-- ----------------------------------------------------------------------------
create type public.session_kind as enum ('practice','revision','boss','exam','homework_check');

create table public.study_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  kind          public.session_kind not null,
  subject_id    uuid references public.subjects,
  topic_id      uuid references public.topics,
  start_time    timestamptz,
  end_time      timestamptz,
  duration_seconds int,
  xp_earned     int default 0,
  metadata      jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index study_sessions_user_idx on public.study_sessions (user_id, start_time desc);

create table public.question_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  session_id    uuid references public.study_sessions,
  question_id   uuid references public.practice_questions,
  topic_id      uuid references public.topics,
  student_answer text,
  correct       boolean not null,
  points        int,
  time_spent_ms int,
  hint_used     boolean default false,
  difficulty    public.difficulty_level,
  created_at    timestamptz default now()
);
create index attempts_user_topic_idx on public.question_attempts (user_id, topic_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Mistakes
-- ----------------------------------------------------------------------------
create type public.mistake_kind as enum ('conceptual','calculation','sign','formula','reading','method','unknown');

create table public.mistakes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  question_id   uuid references public.practice_questions,
  attempt_id    uuid references public.question_attempts,
  topic_id      uuid references public.topics,
  mistake_type  public.mistake_kind,
  description   text,
  created_at    timestamptz default now()
);
create index mistakes_user_topic_idx on public.mistakes (user_id, topic_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Progression: XP, levels, streaks, activity
-- ----------------------------------------------------------------------------
create table public.level_thresholds (
  level          int primary key,
  cumulative_xp  int not null
);
create index level_thresholds_cumulative_idx on public.level_thresholds (cumulative_xp);

create table public.user_progression (
  user_id        uuid primary key references auth.users on delete cascade,
  current_level  int not null default 1,
  current_xp     int not null default 0,      -- xp within current level
  total_xp       int not null default 0,
  last_xp_at     timestamptz,
  updated_at     timestamptz default now()
);

create type public.activity_kind as enum ('practice','homework','classwork','lesson','mission','study_session','streak_bonus','achievement');

create table public.xp_transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users on delete cascade not null,
  amount         int not null,
  reason         text not null,                    -- homework_completed, practice_completed, ...
  description    text,
  entity_type    text,
  entity_id      uuid,
  balance_after  int,
  source         text,                             -- manual, mission, streak, achievement
  transaction_key text,                            -- idempotency key
  created_at     timestamptz default now()
);
create unique index xp_transaction_key_idx on public.xp_transactions (user_id, transaction_key) where transaction_key is not null;
create index xp_transactions_user_idx on public.xp_transactions (user_id, created_at desc);
create index xp_transactions_reason_idx on public.xp_transactions (user_id, reason);

create table public.user_activity_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  activity_type public.activity_kind not null,
  activity_date date not null,
  metadata      jsonb default '{}',
  created_at    timestamptz default now()
);
create index activity_logs_user_date_idx on public.user_activity_logs (user_id, activity_date desc);

-- ----------------------------------------------------------------------------
-- Achievements + missions
-- ----------------------------------------------------------------------------
create table public.achievements (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,            -- first_homework, three_day_streak ...
  name            text not null,
  description     text,
  icon            text,
  category        text,
  requirement_type text,                          -- count, milestone, streak, mastery, level
  requirement_value jsonb,
  xp_reward       int default 0,
  created_at      timestamptz default now()
);

create table public.user_achievements (
  user_id        uuid references auth.users on delete cascade not null,
  achievement_id uuid references public.achievements on delete cascade not null,
  unlocked_at    timestamptz default now(),
  primary key (user_id, achievement_id)
);

create table public.missions (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  type          text not null,                      -- daily, weekly
  name          text not null,
  description   text,
  xp_reward     int not null,
  requirement   jsonb not null,                     -- {kind:'practice_count', target:15}
  created_at    timestamptz default now(),
  unique (code, type)
);

create table public.user_missions (
  user_id       uuid references auth.users on delete cascade not null,
  mission_id    uuid references public.missions on delete cascade not null,
  date_key      text not null,                       -- '2024-01-01' or 'week-2024-W01'
  status        text not null default 'pending',     -- pending, active, completed, expired
  progress      int default 0,
  target        int,
  completed_at  timestamptz,
  primary key (user_id, mission_id, date_key)
);
create index user_missions_active_idx on public.user_missions (user_id, date_key, status);

-- ----------------------------------------------------------------------------
-- Topic mastery
-- ----------------------------------------------------------------------------
create table public.topic_mastery (
  user_id        uuid references auth.users on delete cascade not null,
  topic_id       uuid references public.topics on delete cascade not null,
  mastery_score  numeric(5,2) default 0,            -- 0.00 - 100.00
  evidence       jsonb,                            -- {accuracy, attempts, trend, last_practiced}
  last_practiced timestamptz,
  updated_at     timestamptz default now(),
  primary key (user_id, topic_id)
);

-- ----------------------------------------------------------------------------
-- AI conversations
-- ----------------------------------------------------------------------------
create table public.ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  title        text,
  document_id  uuid references public.documents,
  topic_id     uuid references public.topics,
  model        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index ai_conversations_user_idx on public.ai_conversations (user_id, updated_at desc);

create table public.ai_messages (
  id             uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations on delete cascade not null,
  role           text not null,                       -- user, assistant
  content        text not null,
  created_at     timestamptz default now()
);

