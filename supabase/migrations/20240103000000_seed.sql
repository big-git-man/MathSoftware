-- =====================================================================
-- PHASE 3: Seed data + server-side game logic
-- =====================================================================

alter table public.user_progression
  add column if not exists current_streak int default 0,
  add column if not exists longest_streak int default 0,
  add column if not exists last_activity_date date;

-- ---------------------------------------------------------------------
-- Level thresholds
-- ---------------------------------------------------------------------
insert into public.level_thresholds (level, cumulative_xp)
select level, cumulative_xp
from (
  with recursive levels(level, cumulative_xp) as (
    select 1, 0
    union all
    select level + 1, cumulative_xp + (120 + 110 * level)
    from levels
    where level < 60
  )
  select level, cumulative_xp from levels
) s
on conflict (level) do nothing;

-- ---------------------------------------------------------------------
-- Lesson completions
-- ---------------------------------------------------------------------
create table if not exists public.lesson_completions (
  user_id uuid references auth.users on delete cascade not null,
  lesson_id uuid references public.lessons on delete cascade not null,
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);
create index if not exists lesson_completions_user_idx on public.lesson_completions (user_id);
select public.apply_owner_policies('public.lesson_completions', 'user_id');

-- ---------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------
insert into public.achievements
  (code, name, description, icon, category, requirement_type, requirement_value, xp_reward)
values
('first_homework','First Homework','Upload your first homework assignment.','🏠','milestone','document','{"kind":"homework_uploaded","value":1}',25),
('first_practice','First Practice','Answer your first practice question.','✏️','milestone','attempt','{"kind":"questions_answered","value":1}',25),
('three_day_streak','3 Day Streak','Do something academic on 3 consecutive days.','🔥','streak','streak','{"value":3}',50),
('seven_day_streak','7 Day Streak','Do something academic for a week straight.','🔥','streak','streak','{"value":7}',100),
('thirty_day_streak','30 Day Streak','A month of learning.','🔥','streak','streak','{"value":30}',500),
('ten_lessons','10 Lessons Completed','Finish 10 lessons.','📚','milestone','lesson','{"kind":"lessons_completed","value":10}',100),
('fifty_lessons','50 Lessons Completed','Finish 50 lessons.','📚','milestone','lesson','{"kind":"lessons_completed","value":50}',250),
('hundred_correct','100 Questions Correct','Get 100 practice answers right.','🎯','milestone','attempt','{"kind":"questions_correct","value":100}',100),
('twenty_in_row','20 Correct In A Row','Get 20 correct answers in a row.','⚡','milestone','attempt','{"kind":"correct_in_row","value":20}',200),
('fraction_fighter','Fraction Fighter','Reach 80% mastery in Fractions.','🥊','mastery','topic_mastery','{"topic":"Fractions","value":80}',150),
('algebra_slayer','Algebra Slayer','Reach 70% mastery in Algebra.','⚔️','mastery','topic_mastery','{"topic":"Algebra","value":70}',150),
('geometry_guardian','Geometry Guardian','Reach 70% mastery in Geometry.','🛡️','mastery','topic_mastery','{"topic":"Geometry","value":70}',150),
('perfect_week','Perfect Week','Complete all daily missions for a full week.','🌟','mission','perfect_week','{"value":1}',300),
('comeback_kid','Comeback Kid','Earn XP after a streak was about to break.','🔄','streak','comeback','{"value":1}',100),
('math_master','Math Master','Reach level 20.','🏆','level','level','{"value":20}',500)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- Mission templates
-- ---------------------------------------------------------------------
insert into public.missions (code,type,name,description,xp_reward,requirement) values
('daily_homework','daily','Complete today''s homework','Upload today''s homework assignment.',50,'{"kind":"homework","target":1}'),
('daily_practice','daily','Answer 15 practice questions','Answer 15 questions today.',50,'{"kind":"practice_questions","target":15}'),
('daily_review','daily','Review a weak topic','Study a topic you have struggled with.',30,'{"kind":"review_topic","target":1}'),
('daily_study','daily','Complete a study session','Study for at least 15 minutes.',25,'{"kind":"study_session","target":1}'),
('daily_xp','daily','Earn 500 XP','Gain 500 experience today.',0,'{"kind":"xp","target":500}'),
('weekly_sessions','weekly','5 study sessions','Complete 5 study sessions this week.',150,'{"kind":"study_session","target":5}'),
('weekly_questions','weekly','Answer 100 questions','Answer 100 questions this week.',150,'{"kind":"practice_questions","target":100}'),
('weekly_homework','weekly','3 homework assignments','Complete 3 homework assignments.',150,'{"kind":"homework","target":3}'),
('weekly_xp','weekly','Earn 1500 XP','Earn 1500 XP this week.',200,'{"kind":"xp","target":1500}'),
('weekly_review','weekly','Improve a weak topic','Raise mastery on a weak topic.',100,'{"kind":"review_topic","target":3}')
on conflict (code,type) do nothing;

-- ---------------------------------------------------------------------
-- XP and streak functions
-- ---------------------------------------------------------------------
create or replace function public.recompute_streak(p_user uuid)
returns int
as $$
declare
  v_last date;
  v_streak int := 0;
  v_best int := 0;
begin
  select max(activity_date) into v_last from public.user_activity_logs where user_id = p_user;
  if v_last is null then
    update public.user_progression
    set current_streak = 0, longest_streak = greatest(coalesce(longest_streak,0),0), last_activity_date = null
    where user_id = p_user;
    return 0;
  end if;

  with days as (
    select distinct activity_date d from public.user_activity_logs where user_id = p_user
  ), numbered as (
    select d, d - row_number() over(order by d)::int grp from days
  )
  select count(*) into v_streak
  from numbered
  where grp = (select d - row_number() over(order by d)::int from days where d = v_last);

  with days as (
    select distinct activity_date d from public.user_activity_logs where user_id = p_user
  ), numbered as (
    select d, d - row_number() over(order by d)::int grp from days
  ), runs as (
    select grp, count(*) c from numbered group by grp
  )
  select coalesce(max(c),0) into v_best from runs;

  update public.user_progression
  set current_streak = v_streak,
      longest_streak = greatest(coalesce(longest_streak,0),v_best),
      last_activity_date = v_last,
      updated_at = now()
  where user_id = p_user;
  return v_streak;
end;
$$ language plpgsql;

create or replace function public.advance_xp_mission(p_user uuid, p_amount int)
returns void
as $$
begin
  update public.user_missions um
  set progress = least(target, progress + p_amount)
  where um.user_id = p_user
    and um.status = 'active'
    and progress < target
    and exists (select 1 from public.missions m where m.id = um.mission_id and m.requirement->>'kind' = 'xp');

  update public.user_missions um
  set status = 'completed', completed_at = now()
  where um.user_id = p_user and um.status = 'active' and progress >= target;
end;
$$ language plpgsql;

create or replace function public.award_xp(
  p_user uuid,
  p_amount int,
  p_reason text,
  p_description text default null,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_source text default 'manual',
  p_transaction_key text default null
)
returns int
as $$
declare
  v_balance int;
begin
  if p_transaction_key is not null and exists (
    select 1 from public.xp_transactions where user_id = p_user and transaction_key = p_transaction_key
  ) then
    select total_xp into v_balance from public.user_progression where user_id = p_user;
    return coalesce(v_balance,0);
  end if;

  insert into public.xp_transactions
    (user_id,amount,reason,description,entity_type,entity_id,source,transaction_key)
  values
    (p_user,p_amount,p_reason,p_description,p_entity_type,p_entity_id,p_source,p_transaction_key);

  insert into public.user_progression(user_id,total_xp) values(p_user,0) on conflict(user_id) do nothing;

  update public.user_progression
  set total_xp = total_xp + p_amount, last_xp_at = now(), updated_at = now()
  where user_id = p_user;

  update public.user_progression up
  set current_level = coalesce((select max(level) from public.level_thresholds lt where lt.cumulative_xp <= up.total_xp),1),
      current_xp = up.total_xp - coalesce((select max(cumulative_xp) from public.level_thresholds lt where lt.cumulative_xp <= up.total_xp),0),
      updated_at = now()
  where user_id = p_user;

  select total_xp into v_balance from public.user_progression where user_id = p_user;
  perform public.advance_xp_mission(p_user,p_amount);
  return v_balance;
end;
$$ language plpgsql;

create or replace function public.log_activity(
  p_user uuid,
  p_kind public.activity_kind,
  p_date date default current_date,
  p_metadata jsonb default '{}'
)
returns int
as $$
begin
  insert into public.user_activity_logs(user_id,activity_type,activity_date,metadata)
  values(p_user,p_kind,p_date,p_metadata);
  return public.recompute_streak(p_user);
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- Missions
-- ---------------------------------------------------------------------
create or replace function public.generate_missions(p_user uuid, p_date date default current_date)
returns table(mission_id uuid, code text, type text, name text, progress int, target int, status text, xp_reward int)
as $$
declare
  v_week_key text := 'week-' || to_char(p_date,'IYYY-"W"IW');
  v_day_key text := to_char(p_date,'YYYY-MM-DD');
begin
  insert into public.user_missions(user_id,mission_id,date_key,status,progress,target)
  select p_user,m.id,v_day_key,'active',0,(m.requirement->>'target')::int
  from public.missions m where m.type='daily'
    and not exists(select 1 from public.user_missions um where um.user_id=p_user and um.mission_id=m.id and um.date_key=v_day_key);

  insert into public.user_missions(user_id,mission_id,date_key,status,progress,target)
  select p_user,m.id,v_week_key,'active',0,(m.requirement->>'target')::int
  from public.missions m where m.type='weekly'
    and not exists(select 1 from public.user_missions um where um.user_id=p_user and um.mission_id=m.id and um.date_key=v_week_key);

  return query
  select m.id,m.code,m.type,m.name,um.progress,um.target,um.status,m.xp_reward
  from public.user_missions um join public.missions m on m.id=um.mission_id
  where um.user_id=p_user and um.date_key in(v_day_key,v_week_key);
end;
$$ language plpgsql;

create or replace function public.advance_mission(p_user uuid,p_code text,p_increment int default 1)
returns boolean
as $$
declare
  v_day_key text := to_char(current_date,'YYYY-MM-DD');
  v_week_key text := 'week-' || to_char(current_date,'IYYY-"W"IW');
  v_done boolean := false;
  r record;
begin
  update public.user_missions um
  set progress=least(target,progress+p_increment)
  where um.user_id=p_user and um.status='active' and um.date_key in(v_day_key,v_week_key)
    and exists(select 1 from public.missions m where m.id=um.mission_id and m.code=p_code);

  for r in
    select um.mission_id,m.code,m.xp_reward
    from public.user_missions um join public.missions m on m.id=um.mission_id
    where um.user_id=p_user and um.status='active' and um.date_key in(v_day_key,v_week_key)
      and m.code=p_code and um.progress>=um.target
  loop
    update public.user_missions set status='completed',completed_at=now()
    where user_id=p_user and mission_id=r.mission_id and date_key in(v_day_key,v_week_key);
    if r.xp_reward > 0 then
      perform public.award_xp(p_user,r.xp_reward,'mission_completed',r.code || ' completed','mission',r.mission_id,'mission','mission:' || r.mission_id::text);
    end if;
    v_done:=true;
  end loop;
  return v_done;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- Topic mastery
-- ---------------------------------------------------------------------
create or replace function public.update_topic_mastery(
  p_user uuid,
  p_topic uuid,
  p_correct boolean,
  p_difficulty public.difficulty_level default null
)
returns numeric
as $$
declare
  v_old numeric := 0;
  v_new numeric;
  v_weight numeric := 1;
begin
  if p_difficulty = 'hard' then v_weight := 1.5;
  elsif p_difficulty = 'medium' then v_weight := 1.2;
  end if;

  select mastery_score into v_old from public.topic_mastery where user_id=p_user and topic_id=p_topic;
  if not found then v_old:=0; end if;

  if p_correct then v_new := least(100, v_old + 5 * v_weight);
  else v_new := greatest(0, v_old - 3 * v_weight);
  end if;

  insert into public.topic_mastery(user_id,topic_id,mastery_score,evidence,last_practiced,updated_at)
  values(p_user,p_topic,v_new,jsonb_build_object('difficulty',p_difficulty),now(),now())
  on conflict(user_id,topic_id) do update set
    mastery_score=excluded.mastery_score, evidence=excluded.evidence,
    last_practiced=excluded.last_practiced, updated_at=now();
  return v_new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- Achievement check
-- ---------------------------------------------------------------------
create or replace function public.check_achievements(p_user uuid)
returns int
as $$
declare
  v_count int := 0;
  a record;
  v_value int;
begin
  for a in select * from public.achievements loop
    if exists(select 1 from public.user_achievements ua where ua.user_id=p_user and ua.achievement_id=a.id) then continue; end if;
    v_value := 0;
    if a.requirement_type='level' then
      select current_level into v_value from public.user_progression where user_id=p_user;
    elsif a.requirement_type='streak' then
      select current_streak into v_value from public.user_progression where user_id=p_user;
    elsif a.requirement_type='lesson' then
      select count(*) into v_value from public.lesson_completions where user_id=p_user;
    elsif a.requirement_type='attempt' then
      if a.requirement_value->>'kind'='questions_correct' then
        select count(*) into v_value from public.question_attempts where user_id=p_user and correct;
      else
        select count(*) into v_value from public.question_attempts where user_id=p_user;
      end if;
    elsif a.requirement_type='document' then
      select count(*) into v_value from public.documents where user_id=p_user and document_type='homework';
    end if;

    if v_value >= coalesce((a.requirement_value->>'value')::int,2147483647) then
      insert into public.user_achievements(user_id,achievement_id) values(p_user,a.id) on conflict do nothing;
      perform public.award_xp(p_user,a.xp_reward,'achievement_unlocked',a.name,'achievement',a.id,'achievement','achievement:' || a.id::text);
      v_count:=v_count+1;
    end if;
  end loop;
  return v_count;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- Default Mathematics curriculum
-- ---------------------------------------------------------------------
create or replace function public.init_default_curriculum(p_user uuid)
returns void
as $$
declare
  v_subject uuid;
  v_course uuid;
  v_unit uuid;
begin
  if exists (select 1 from public.subjects where user_id = p_user) then return; end if;

  insert into public.subjects (user_id,name,description,icon,color,position)
  values (p_user,'Mathematics','Core mathematics curriculum','calculator','#1e3a8a',0)
  returning id into v_subject;

  insert into public.courses (user_id,subject_id,name,position)
  values (p_user,v_subject,'Algebra',0) returning id into v_course;

  insert into public.units (user_id,course_id,name,position)
  values (p_user,v_course,'Foundations',0) returning id into v_unit;
  insert into public.topics (user_id,unit_id,name,description,position,color) values
    (p_user,v_unit,'Numbers & Operations','Whole numbers, integers, rationals',0,'#2563eb'),
    (p_user,v_unit,'Integers','Positive and negative integers',1,'#2563eb'),
    (p_user,v_unit,'Fractions','Fraction operations and equivalence',2,'#ea580c'),
    (p_user,v_unit,'Decimals','Decimal operations',3,'#2563eb');

  insert into public.units (user_id,course_id,name,position)
  values (p_user,v_course,'Linear Equations',1) returning id into v_unit;
  insert into public.topics (user_id,unit_id,name,description,position,color) values
    (p_user,v_unit,'Algebra','Variables and expressions',0,'#7c3aed'),
    (p_user,v_unit,'Solving One-Step Equations','Isolate the variable',1,'#7c3aed'),
    (p_user,v_unit,'Solving Two-Step Equations','Two operation equations',2,'#7c3aed'),
    (p_user,v_unit,'Multi-Step Equations','Equations with multiple steps',3,'#7c3aed'),
    (p_user,v_unit,'Linear Functions','Coordinate plane and linear graphs',4,'#7c3aed');

  insert into public.courses (user_id,subject_id,name,position)
  values (p_user,v_subject,'Geometry',1) returning id into v_course;
  insert into public.units (user_id,course_id,name,position)
  values (p_user,v_course,'Basics',0) returning id into v_unit;
  insert into public.topics (user_id,unit_id,name,description,position,color) values
    (p_user,v_unit,'Points, Lines & Angles','Geometric primitives',0,'#0d9488'),
    (p_user,v_unit,'Triangles','Triangle properties and types',1,'#0d9488'),
    (p_user,v_unit,'Geometry','Angles, area and perimeter',2,'#0d9488');
  insert into public.units (user_id,course_id,name,position)
  values (p_user,v_course,'Area & Perimeter',1) returning id into v_unit;
  insert into public.topics (user_id,unit_id,name,description,position,color)
  values (p_user,v_unit,'Area & Perimeter','Rectangle, triangle, circle measures',0,'#0d9488');

  insert into public.courses (user_id,subject_id,name,position)
  values (p_user,v_subject,'Statistics',2) returning id into v_course;
  insert into public.units (user_id,course_id,name,position)
  values (p_user,v_course,'Data Analysis',0) returning id into v_unit;
  insert into public.topics (user_id,unit_id,name,description,position,color) values
    (p_user,v_unit,'Statistics','Mean, median, mode, probability basics',0,'#c2185b'),
    (p_user,v_unit,'Probability','Basic probability',1,'#c2185b');
end;
$$ language plpgsql;

-- Complete a lesson, award progress XP/activity, and check achievements.
create or replace function public.complete_lesson(p_user uuid, p_lesson uuid)
returns void
as $$
begin
  insert into public.lesson_completions(user_id,lesson_id)
  values(p_user,p_lesson)
  on conflict(user_id,lesson_id) do nothing;
  perform public.log_activity(p_user,'lesson',current_date,jsonb_build_object('lesson_id',p_lesson));
  perform public.check_achievements(p_user);
end;
$$ language plpgsql;
