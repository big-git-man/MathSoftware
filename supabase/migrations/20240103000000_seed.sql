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
  select 1, 0::int, 0::int
  union all
  select l + 1,
         (120 + 110 * (l + 1))::int,
         (cum + (120 + 110 * l))::int
  from levels
  where l < 60
)
select l, cum from levels;

-- ----------------------------------------------------------------------------
-- Lesson completions
-- ----------------------------------------------------------------------------
create table public.lesson_completions (
  user_id      uuid references auth.users on delete cascade not null,
  lesson_id    uuid references public.lessons on delete cascade not null,
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);
create index lesson_completions_user_idx on public.lesson_completions (user_id);
select public.apply_owner_policies('public.lesson_completions', 'user_id');

-- ----------------------------------------------------------------------------
-- Achievements (requirement stored as jsonb: {metric, compare, value})
-- ----------------------------------------------------------------------------
insert into public.achievements (code, name, description, icon, category, requirement_type, requirement_value, xp_reward) values
('first_homework','First Homework','Upload your first homework assignment.','🏠', 'milestone', 'document', '{"kind":"homework_uploaded","value":1}', 25),
('first_practice','First Practice','Answer your first practice question.','✏️','milestone','attempt', '{"kind":"questions_answered","value":1}', 25),
('three_day_streak','3 Day Streak','Do something academic on 3 consecutive days.','🔥','streak', 'streak', '{"value":3}', 50),
('seven_day_streak','7 Day Streak','Do something academic for a week straight.','🔥','streak', 'streak', '{"value":7}', 100),
('thirty_day_streak','30 Day Streak','A month of learning!','🔥','streak', 'streak', '{"value":30}', 500),
('ten_lessons','10 Lessons Completed','Finish 10 lessons.','📚','milestone','lesson', '{"kind":"lessons_completed","value":10}', 100),
('fifty_lessons','50 Lessons Completed','Half a hundred lessons.','📚','milestone','lesson', '{"kind":"lessons_completed","value":50}', 250),
('hundred_correct','100 Questions Correct','Get 100 practice answers right.','🎯','milestone','attempt', '{"kind":"questions_correct","value":100}', 100),
('twenty_in_row','20 Correct In A Row','A perfect streak of correct answers.','⚡','milestone','attempt', '{"kind":"correct_in_row","value":20}', 200),
('fraction_fighter','Fraction Fighter','Reach 80% mastery in Fractions.','🥊','mastery','topic_mastery', '{"topic":"Fractions","value":80}', 150),
('algebra_slayer','Algebra Slayer','Reach 70% mastery in Algebra.','⚔️','mastery','topic_mastery', '{"topic":"Algebra","value":70}', 150),
('geometry_guardian','Geometry Guardian','Reach 70% mastery in Geometry.','🛡️','mastery','topic_mastery', '{"topic":"Geometry","value":70}', 150),
('perfect_week','Perfect Week','Complete all daily missions for a full week.','🌟','mission','perfect_week', '{"value":1}', 300),
('comeback_kid','Comeback Kid','Earn XP after a streak was about to break.','🔄','streak','comeback', '{"value":1}', 100),
('math_master','Math Master','Reach level 20.','🏆','level','level', '{"value":20}', 500);

-- ----------------------------------------------------------------------------
-- Mission templates (daily + weekly). Client generates concrete per-user
-- missions for a given date via generate_missions().
-- ----------------------------------------------------------------------------
-- daily
insert into public.missions (code, type, name, description, xp_reward, requirement) values
('daily_homework','daily','Complete today''s homework','Upload today''s homework assignment.', 50, '{"kind":"homework","target":1}'),
('daily_practice','daily','Answer 15 practice questions','Answer 15 questions today.', 50, '{"kind":"practice_questions","target":15}'),
('daily_review','daily','Review a weak topic','Study a topic you''ve struggled with.', 30, '{"kind":"review_topic","target":1}'),
('daily_study','daily','Complete a study session','Study for at least 15 minutes.', 25, '{"kind":"study_session","target":1}'),
('daily_xp','daily','Earn 500 XP','Gain 500 experience today.', 0, '{"kind":"xp","target":500}');
-- weekly
insert into public.missions (code, type, name, description, xp_reward, requirement) values
('weekly_sessions','weekly','5 study sessions','Complete 5 study sessions this week.', 150, '{"kind":"study_session","target":5}'),
('weekly_questions','weekly','Answer 100 questions','Answer 100 questions this week.', 150, '{"kind":"practice_questions","target":100}'),
('weekly_homework','weekly','3 homework assignments','Complete 3 homework assignments.', 150, '{"kind":"homework","target":3}'),
('weekly_xp','weekly','Earn 1500 XP','Earn 1500 XP this week.', 200, '{"kind":"xp","target":1500}'),
('weekly_review','weekly','Improve a weak topic','Raise mastery on a weak topic.', 100, '{"kind":"review_topic","target":3}');

-- ----------------------------------------------------------------------------
-- award_xp: idempotent XP grant that updates user_progression + level + streak.
-- Called by the client and by edge functions. Server-side = tamper-proof.
-- ----------------------------------------------------------------------------
create or replace function public.award_xp(
  p_user            uuid,
  p_amount          int,
  p_reason          text,
  p_description     text default null,
  p_entity_type     text default null,
  p_entity_id       uuid default null,
  p_source          text default 'manual',
  p_transaction_key text default null
) returns int language plpgsql as $$
declare
  v_balance int;
begin
  -- idempotency: a transaction_key guarantees a given reward is granted once
  if p_transaction_key is not null and exists (
    select 1 from public.xp_transactions
    where user_id = p_user and transaction_key = p_transaction_key
  ) then
    return (select total_xp from public.user_progression where user_id = p_user);
  end if;

  insert into public.xp_transactions
    (user_id, amount, reason, description, entity_type, entity_id, source, transaction_key)
  values
    (p_user, p_amount, p_reason, p_description, p_entity_type, p_entity_id, p_source, p_transaction_key);

  -- progression row exists (created on signup) but guard anyway
  insert into public.user_progression (user_id, total_xp) values (p_user, 0)
  on conflict (user_id) do update set total_xp = user_progression.total_xp;

  update public.user_progression
  set total_xp = total_xp + p_amount,
      last_xp_at = now()
  where user_id = p_user;

  -- recompute level: highest threshold whose cumulative_xp <= total_xp
  update public.user_progression up
  set current_level = lt.level,
      current_xp   = up.total_xp - lt.cumulative_xp
  from public.level_thresholds lt
  where up.user_id = p_user
    and lt.cumulative_xp = (
      select max(cumulative_xp) from public.level_thresholds
      where cumulative_xp <= up.total_xp
    );

  select total_xp into v_balance from public.user_progression where user_id = p_user;
  perform public.recompute_streak(p_user);
  perform public.advance_xp_mission(p_user, p_amount);
  return v_balance;
end;
$$ LANGUAGE plpgsql;

-- recompute_streak: consecutive academic days ending at the most recent
-- active day. Mirrors the client-side streak helper so the two never disagree.
create or replace function public.recompute_streak(p_user uuid) returns int language plpgsql as $$
declare
  v_last  date;
  v_streak int := 0;
  v_best   int;
  v_today  date := current_date;
begin
  select max(activity_date) into v_last
  from public.user_activity_logs
  where user_id = p_user;

  if v_last is null then
    update public.user_progression
      set current_streak = 0, longest_streak = greatest(coalesce(longest_streak,0), 0), last_activity_date = null
    where user_id = p_user;
    return 0;
  end if;

  -- length of the consecutive-day island ending at v_last
  with days as (
    select distinct activity_date as d
    from public.user_activity_logs
    where user_id = p_user
      and activity_date <= v_last
      and activity_date >= v_last - interval '365 days'
  ),
  numbered as (
    select d, row_number() over (order by d) as rn from days
  ),
  islands as (
    select d, (d - rn) as grp from numbered
  )
  select count(*) into v_streak
  from islands
  where grp = (select (d - rn) from islands where d = v_last);

  -- longest run for this user
  with days2 as (
    select distinct activity_date as d
    from public.user_activity_logs
    where user_id = p_user
  ),
  n2 as ( select d, row_number() over (order by d) as rn from days2 ),
  i2 as ( select d, (d - rn) as grp from n2 )
  select max(c) into v_best from (select count(*) c from i2 group by grp) g;

  update public.user_progression
    set current_streak = v_streak,
        longest_streak = greatest(coalesce(longest_streak,0), coalesce(v_best,0)),
        last_activity_date = v_last
  where user_id = p_user;

  return v_streak;
end;
$$ LANGUAGE plpgsql;

-- log_activity: records a meaningful academic event + refreshes the streak.
create or replace function public.log_activity(
  p_user uuid,
  p_kind public.activity_kind,
  p_date date default current_date,
  p_metadata jsonb default '{}'
) returns int language plpgsql as $$
begin
  insert into public.user_activity_logs (user_id, activity_type, activity_date, metadata)
  values (p_user, p_kind, p_date, p_metadata);
  return public.recompute_streak(p_user);
end;
$$ LANGUAGE plpgsql;

-- advance_xp_mission: increment daily/weekly missions whose requirement.kind='xp'
create or replace function public.advance_xp_mission(p_user uuid, p_amount int) returns void language plpgsql as $$
begin
  update public.user_missions um
  set progress = least(target, progress + p_amount)
  where um.user_id = p_user
    and um.status = 'active'
    and (select requirement->>'kind' from public.missions m where m.id = um.mission_id) = 'xp'
    and progress < target;
  -- complete any now-satisfied xp missions
  update public.user_missions um
  set status = 'completed', completed_at = now()
  where um.user_id = p_user
    and um.status = 'active'
    and progress >= (select requirement->>'target' from public.missions m where m.id = um.mission_id)::int;
end;
$$ LANGUAGE plpgsql;

-- generate_missions: ensure today's daily + this week's weekly missions exist
-- for the given user/date (idempotent). date_key for daily = 'YYYY-MM-DD';
-- for weekly = 'week-YYYY-Www' (ISO week).
create or replace function public.generate_missions(p_user uuid, p_date date default current_date)
returns table(mission_id uuid, code text, type text, name text, progress int, target int, status text, xp_reward int)
language plpgsql as $$
declare
  v_week_key text := 'week-' || to_char(p_date, 'IYYY-"W"IW');
  v_day_key  text := to_char(p_date, 'YYYY-MM-DD');
begin
  -- daily missions for today
  insert into public.user_missions (user_id, mission_id, date_key, status, progress, target)
  select p_user, m.id, v_day_key, 'active', 0,
         (m.requirement->>'target')::int
  from public.missions m
  where m.type = 'daily'
    and not exists (
      select 1 from public.user_missions um
      where um.user_id = p_user and um.mission_id = m.id and um.date_key = v_day_key
    );

  -- weekly missions for this ISO week
  insert into public.user_missions (user_id, mission_id, date_key, status, progress, target)
  select p_user, m.id, v_week_key, 'active', 0,
         (m.requirement->>'target')::int
  from public.missions m
  where m.type = 'weekly'
    and not exists (
      select 1 from public.user_missions um
      where um.user_id = p_user and um.mission_id = m.id and um.date_key = v_week_key
    );

  return query
  select m.id, m.code, m.type, m.name, um.progress, um.target, um.status, m.xp_reward
  from public.user_missions um
  join public.missions m on m.id = um.mission_id
  where um.user_id = p_user
    and (um.date_key = v_day_key or um.date_key = v_week_key);
end;
$$ LANGUAGE plpgsql;

-- advance_mission: increment a named mission's progress for 'today' (daily)
-- or current week (weekly) by p_increment. Completes the mission + grants xp
-- when the target is reached (idempotent via award_xp transaction_key).
create or replace function public.advance_mission(p_user uuid, p_code text, p_increment int default 1)
returns boolean language plpgsql as $$
declare
  v_week_key text := 'week-' || to_char(current_date, 'IYYY-"W"IW');
  v_day_key  text := to_char(current_date, 'YYYY-MM-DD');
  v_done     boolean := false;
  r          record;
begin
  -- increment progress on active missions (today or this week) with this code
  update public.user_missions um
  set progress = least(target, progress + p_increment)
  where um.user_id = p_user
    and um.mission_id in (select id from public.missions where code = p_code)
    and um.status = 'active'
    and (um.date_key = v_day_key or um.date_key = v_week_key);

  -- complete newly-satisfied missions
  for r in
    select um.mission_id, m.code, m.xp_reward
    from public.user_missions um
    join public.missions m on m.id = um.mission_id
    where um.user_id = p_user
      and m.code = p_code
      and um.status = 'active'
      and um.progress >= um.target
  loop
    update public.user_missions
    set status = 'completed', completed_at = now()
    where user_id = p_user and mission_id = r.mission_id
      and date_key in (v_day_key, v_week_key);
    perform public.award_xp(p_user, r.xp_reward, 'mission_completed',
      r.code || ' completed', 'mission', r.mission_id, 'mission',
      'mission:' || r.mission_id::text);
    v_done := true;
  end loop;
  return v_done;
end;
$$ LANGUAGE plpgsql;

-- complete_lesson: mark a lesson done, grant XP, log activity, check achievements.
create or replace function public.complete_lesson(p_user uuid, p_lesson uuid)
returns void language plpgsql as $$
begin
  insert into public.lesson_completions (user_id, lesson_id) values (p_user, p_lesson)
  on conflict (user_id, lesson_id) do nothing;
  perform public.log_activity(p_user, 'lesson', current_date, jsonb_build_object('lesson_id', p_lesson));
  perform public.check_achievements(p_user);
end;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Achievement evaluation. Metrics are derived from the user's own data.
-- ----------------------------------------------------------------------------
create or replace function public.check_achievements(p_user uuid)
returns table(achievement_id uuid, code text, unlocked boolean) language plpgsql as $$
declare
  r record;
  v_val int;
  v_ok  boolean;
  stats jsonb;
begin
  -- cache a small set of metrics
  select jsonb_build_object(
    'questions_correct',   (select count(*) from public.question_attempts where user_id = p_user and correct),
    'questions_answered',  (select count(*) from public.question_attempts where user_id = p_user),
    'lessons_completed',   (select count(*) from public.lesson_completions where user_id = p_user),
    'homework_uploaded',   (select count(*) from public.documents where user_id = p_user and document_type = 'homework'),
    'current_streak',      (select coalesce(current_streak,0) from public.user_progression where user_id = p_user),
    'total_xp',            (select coalesce(total_xp,0) from public.user_progression where user_id = p_user),
    'current_level',       (select coalesce(current_level,1) from public.user_progression where user_id = p_user)
  ) into stats;

  for r in
    select id, code, requirement_type, requirement_value
    from public.achievements
    where id not in (select achievement_id from public.user_achievements where user_id = p_user)
  loop
    v_ok := false;
    case r.requirement_type
      when 'attempt' then
        v_val := (stats->>(case r.requirement_value->>'kind'
                            when 'questions_correct' then 'questions_correct'
                            when 'questions_answered' then 'questions_answered' end))::int;
        v_ok := v_val >= (r.requirement_value->>'value')::int;
      when 'lesson' then
        v_val := (stats->>'lessons_completed')::int;
        v_ok := v_val >= (r.requirement_value->>'value')::int;
      when 'streak' then
        v_val := (stats->>'current_streak')::int;
        v_ok := v_val >= (r.requirement_value->>'value')::int;
      when 'level' then
        v_val := (stats->>'current_level')::int;
        v_ok := v_val >= (r.requirement_value->>'value')::int;
      when 'milestone' then
        v_val := (stats->>'homework_uploaded')::int;
        v_ok := v_val >= (r.requirement_value->>'value')::int;
      when 'topic_mastery' then
        -- topic name based mastery threshold
        select (tm.mastery_score >= (r.requirement_value->>'value')::numeric(5,2))
          into v_ok
        from public.topic_mastery tm
        join public.topics tp on tp.id = tm.topic_id
        where tm.user_id = p_user and tp.name ilike r.requirement_value->>'topic'
        limit 1;
        -- if no mastery row yet, v_ok stays false
      when 'perfect_week' then
        -- every daily mission for the last 7 days completed
        v_ok := exists (
          select 1 from public.missions m
          where m.type='daily'
          and exists (
            select 1 from public.user_missions um
            where um.user_id=p_user and um.mission_id=m.id
              and um.date_key = to_char(current_date - interval '1 day' * generate_series(0,6), 'YYYY-MM-DD')
              and um.status='completed'
          )
        );
      when 'comeback' then
        -- streak hit 0 recently then resumed (last activity > 7 days ago and streak>0 now)
        v_ok := exists (
          select 1 from public.user_progression up
          where up.user_id = p_user
            and up.current_streak > 0
            and up.last_activity_date is not null
            and up.last_activity_date < current_date  -- activity resumed after a gap
        );
      else
        v_ok := false;
    end case;

    if v_ok then
      insert into public.user_achievements (user_id, achievement_id)
      values (p_user, r.id)
      on conflict do nothing;
      perform public.award_xp(p_user, r.xp_reward, 'achievement_unlocked', r.name, 'achievement', r.id, 'achievement', 'achievement:' || r.code);
    end if;
    return query select r.id, r.code, v_ok;
  end loop;
end;
$$ LANGUAGE plpgsql;

-- create_or_update_topic_mastery: recompute mastery for a topic after an
-- attempt. Mastery blends accuracy, attempt count, difficulty and recency.
create or replace function public.update_topic_mastery(
  p_user uuid, p_topic uuid, p_correct boolean, p_difficulty text, p_attempt_ts timestamptz default now()
) returns numeric language plpgsql as $$
declare
  v_mastery numeric(5,2);
  v_accuracy numeric;
  v_recent  numeric;
  v_count   int;
begin
  select coalesce(avg(case when correct then 1.0 else 0.0 end),0),
         count(*)
  into v_accuracy, v_count
  from public.question_attempts
  where user_id = p_user and topic_id = p_topic;

  -- recency-weighted accuracy over the last 7 days (recent performance)
  select coalesce(avg(case when correct then 1.0 else 0.0 end),0) into v_recent
  from public.question_attempts
  where user_id = p_user and topic_id = p_topic and created_at >= p_attempt_ts - interval '7 days';

  -- overall mastery: 0.6*recent + 0.4*alltime, scaled by confidence (volume)
  v_mastery := round(100 * (0.6 * v_recent + 0.4 * v_accuracy) *
                     (1 - exp(-v_count/10.0)), 2);

  insert into public.topic_mastery (user_id, topic_id, mastery_score, evidence, last_practiced)
  values (p_user, p_topic, v_mastery,
          jsonb_build_object('accuracy', v_accuracy, 'attempts', v_count, 'recent', v_recent, 'difficulty', p_difficulty),
          p_attempt_ts)
  on conflict (user_id, topic_id) do update
    set mastery_score = excluded.mastery_score,
        evidence = excluded.evidence,
        last_practiced = excluded.last_practiced,
        updated_at = now();
  return v_mastery;
end;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- init_default_curriculum: create a sensible default Mathematics curriculum
-- for a student. Fully data-driven from here on; the student can edit it.
-- Subject -> Course -> Unit -> Topic -> Lesson
-- ----------------------------------------------------------------------------
create or replace function public.init_default_curriculum(p_user uuid)
returns void language plpgsql as $$
declare
  v_subject uuid;
  v_course  uuid;
  v_unit    uuid;
  v_topic   uuid;
begin
  -- only seed if the user has no subjects yet
  if exists (select 1 from public.subjects where user_id = p_user) then
    return;
  end if;

  insert into public.subjects (user_id, name, description, icon, color, position)
  values (p_user, 'Mathematics', 'Core mathematics curriculum', ' calculator', '#1e3a8a', 0)
  returning id into v_subject;

  -- Course: Algebra
  insert into public.courses (user_id, subject_id, name, position)
  values (p_user, v_subject, 'Algebra', 0) returning id into v_course;

  insert into public.units (user_id, course_id, name, position)
  values (p_user, v_course, 'Foundations', 0) returning id into v_unit;
  insert into public.topics (user_id, unit_id, name, description, position, color)
  values (p_user, v_unit, 'Numbers & Operations', 'Whole numbers, integers, rationals', 0, '#2563eb');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Integers', 'Positive and negative integers', 1, '#2563eb');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Fractions', 'Fraction operations and equivalence', 2, '#ea580c');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Decimals', 'Decimal operations', 3, '#2563eb');

  insert into public.units (user_id, course_id, name, position)
  values (p_user, v_course, 'Linear Equations', 1) returning id into v_unit;
  insert into public.topics (user_id, unit_id, name, description, position, color)
  values (p_user, v_unit, 'Algebra', 'Variables and expressions', 0, '#7c3aed');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Solving One-Step Equations', 'Isolate the variable', 1, '#7c3aed');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Solving Two-Step Equations', 'Two operation equations', 2, '#7c3aed');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Multi-Step Equations', 'Equations with multiple steps', 3, '#7c3aed');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Linear Functions', 'Coordinate plane and linear graphs', 4, '#7c3aed');

  -- Course: Geometry
  insert into public.courses (user_id, subject_id, name, position)
  values (p_user, v_subject, 'Geometry', 1) returning id into v_course;

  insert into public.units (user_id, course_id, name, position)
  values (p_user, v_course, 'Basics', 0) returning id into v_unit;
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Points, Lines & Angles', 'Geometric primitives', 0, '#0d9488');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Triangles', 'Triangle properties and types', 1, '#0d9488');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Geometry', 'Angles, area and perimeter', 2, '#0d9488');

  insert into public.units (user_id, course_id, name, position)
  values (p_user, v_course, 'Area & Perimeter', 1) returning id into v_unit;
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Area & Perimeter', 'Rectangle, triangle, circle measures', 0, '#0d9488');

  -- Course: Statistics
  insert into public.courses (user_id, subject_id, name, position)
  values (p_user, v_subject, 'Statistics', 2) returning id into v_course;

  insert into public.units (user_id, course_id, name, position)
  values (p_user, v_course, 'Data Analysis', 0) returning id into v_unit;
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Statistics', 'Mean, median, mode, probability basics', 0, '#c2185b');
  insert into public.topics (user_id, unit_id, name, position, color)
  values (p_user, v_unit, 'Probability', 'Basic probability', 1, '#c2185b');
end;
$$ LANGUAGE plpgsql;
