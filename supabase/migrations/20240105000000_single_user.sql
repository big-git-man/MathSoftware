-- Single-user private app: registration is closed once the one student
-- account exists. The limit is configurable via system_settings so the schema
-- stays future-proof for additional users if the day ever comes.
create table public.system_settings (
  key   text primary key,
  value jsonb not null
);

insert into public.system_settings (key, value) values
  ('registration_open', 'true'::jsonb),
  ('max_users', '1'::jsonb)
on conflict (key) do nothing;

create or replace function public.enforce_user_limit()
returns trigger
as $$
declare
  v_max   int;
  v_open  boolean;
begin
  select (value->>'max_users')::int into v_max
  from public.system_settings
  where key = 'max_users';

  select (value->>'registration_open')::boolean into v_open
  from public.system_settings
  where key = 'registration_open';

  v_max := coalesce(v_max, 1);
  v_open := coalesce(v_open, false);

  if not v_open then
    raise exception 'registration_is_closed';
  end if;

  if (select count(*) from auth.users) >= v_max then
    raise exception 'registration_is_closed';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_user_limit on auth.users;
create trigger enforce_user_limit
  before insert on auth.users
  for each row execute function public.enforce_user_limit();
