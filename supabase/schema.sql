-- Run once in the Supabase SQL editor. Everyone can read; writes need the group PIN.
create table if not exists schedule_state (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists schedule_secret (
  id int primary key default 1 check (id = 1),
  pin text not null
);
alter table schedule_state enable row level security;
alter table schedule_secret enable row level security;
create policy "public read" on schedule_state for select using (true);
-- schedule_secret has no policies => unreadable from the client.

create or replace function save_state(p_pin text, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from schedule_secret where id = 1 and pin = p_pin) then
    raise exception 'wrong pin';
  end if;
  insert into schedule_state (id, data) values (1, p_data)
  on conflict (id) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function check_pin(p_pin text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from schedule_secret where id = 1 and pin = p_pin)
$$;

grant execute on function save_state(text, jsonb), check_pin(text) to anon;

-- Set your PIN (change 'abantu'):
insert into schedule_secret (id, pin) values (1, 'abantu')
on conflict (id) do update set pin = excluded.pin;
