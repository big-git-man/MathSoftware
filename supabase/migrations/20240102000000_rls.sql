-- =====================================================================
-- PHASE 2: Row Level Security
-- Every user-scoped table is locked to its owner. The database itself
-- enforces privacy, not just the application code.
-- =====================================================================

-- Helper: apply full owner-isolation (select/insert/update/delete) to a
-- table that has a user_id column.
create or replace function public.apply_owner_policies(p_table regclass, p_user_col text)
returns void language plpgsql as $fn$
declare
  tbl text := p_table::text;
begin
  execute format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
  execute format('DROP POLICY IF EXISTS "%s_select" ON %s', tbl, tbl);
  execute format('DROP POLICY IF EXISTS "%s_insert" ON %s', tbl, tbl);
  execute format('DROP POLICY IF EXISTS "%s_update" ON %s', tbl, tbl);
  execute format('DROP POLICY IF EXISTS "%s_delete" ON %s', tbl, tbl);
  execute format('CREATE POLICY "%s_select" ON %s FOR SELECT USING (%s = auth.uid())', tbl, tbl, p_user_col);
  execute format('CREATE POLICY "%s_insert" ON %s FOR INSERT WITH CHECK (%s = auth.uid())', tbl, tbl, p_user_col);
  execute format('CREATE POLICY "%s_update" ON %s FOR UPDATE USING (%s = auth.uid())', tbl, tbl, p_user_col);
  execute format('CREATE POLICY "%s_delete" ON %s FOR DELETE USING (%s = auth.uid())', tbl, tbl, p_user_col);
  execute format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', tbl);
end;
$fn$;

-- Owner-isolated tables (user_id column)
select public.apply_owner_policies('public.profiles', 'id');
select public.apply_owner_policies('public.subjects', 'user_id');
select public.apply_owner_policies('public.courses', 'user_id');
select public.apply_owner_policies('public.units', 'user_id');
select public.apply_owner_policies('public.topics', 'user_id');
select public.apply_owner_policies('public.lessons', 'user_id');
select public.apply_owner_policies('public.tags', 'user_id');
select public.apply_owner_policies('public.assignments', 'user_id');
select public.apply_owner_policies('public.documents', 'user_id');
select public.apply_owner_policies('public.document_pages', 'user_id');
select public.apply_owner_policies('public.document_processing_jobs', 'user_id');
select public.apply_owner_policies('public.practice_questions', 'user_id');
select public.apply_owner_policies('public.study_sessions', 'user_id');
select public.apply_owner_policies('public.question_attempts', 'user_id');
select public.apply_owner_policies('public.mistakes', 'user_id');
select public.apply_owner_policies('public.xp_transactions', 'user_id');
select public.apply_owner_policies('public.user_activity_logs', 'user_id');
select public.apply_owner_policies('public.user_achievements', 'user_id');
select public.apply_owner_policies('public.user_missions', 'user_id');
select public.apply_owner_policies('public.topic_mastery', 'user_id');
select public.apply_owner_policies('public.ai_conversations', 'user_id');

-- practice_questions: shared bank (user_id IS NULL) is readable by everyone,
-- own rows are fully owned. Shared questions are NOT insertable by the client.
create policy "practice_questions_shared_select"
  on public.practice_questions for select using (user_id IS NULL);
create policy "practice_questions_shared_no_insert"
  on public.practice_questions for insert with check (user_id IS NOT NULL);

-- Catalog tables: readable by any authenticated user, not writable by clients.
create or replace function public.enable_readable_catalog(p_table text)
returns void language plpgsql as $fn$
begin
  execute format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);
  execute format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (auth.uid() IS NOT NULL)', p_table, p_table);
  execute format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p_table);
end;
$fn$;

select public.enable_readable_catalog('level_thresholds');
select public.enable_readable_catalog('achievements');
select public.enable_readable_catalog('missions');

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'profiles','subjects','courses','units','topics','lessons','tags',
        'assignments','documents','document_pages','document_processing_jobs',
        'practice_questions','study_sessions','topic_mastery',
        'ai_conversations','user_progression','xp_transactions',
        'user_missions','missions','mistakes'
      )
  loop
    execute format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      r.tablename, r.tablename);
  end loop;
end;
$$;

-- Auto-provision a profile + progression + default curriculum for new users.
create or replace function public.on_auth_user_created()
returns trigger language plpgsql as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.email);
  insert into public.user_progression (user_id) values (new.id);
  perform public.init_default_curriculum(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.on_auth_user_created();


-- Join tables inherit ownership through their parent records.
alter table public.assignment_documents enable row level security;
alter table public.assignment_documents force row level security;
create policy "assignment_documents_owner" on public.assignment_documents
  for all using (
    exists (select 1 from public.assignments a where a.id = assignment_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.assignments a where a.id = assignment_id and a.user_id = auth.uid())
  );

alter table public.document_tags enable row level security;
alter table public.document_tags force row level security;
create policy "document_tags_owner" on public.document_tags
  for all using (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );

alter table public.ai_messages enable row level security;
alter table public.ai_messages force row level security;
create policy "ai_messages_owner" on public.ai_messages
  for all using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
