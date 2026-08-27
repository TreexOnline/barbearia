-- Extensão necessária para o índice de exclusão que impede horários sobrepostos
create extension if not exists btree_gist;

-- =========================================================
-- Tabelas
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'barber')),
  is_admin boolean not null default false,
  full_name text not null default '',
  phone text,
  commission_percent numeric(5, 2),
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.barber_schedules (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

create table public.barber_time_off (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  reason text
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  barber_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id),
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  -- impede dois agendamentos ativos sobrepostos para o mesmo barbeiro
  exclude using gist (
    barber_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status <> 'cancelled')
);

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  type text not null check (type in ('confirmation', 'reminder', 'cancellation')),
  status text not null default 'sent',
  sent_at timestamptz not null default now()
);

create index appointments_barber_start_idx on public.appointments (barber_id, start_time);
create index appointments_client_idx on public.appointments (client_id);

-- =========================================================
-- Perfil automático ao criar usuário no Supabase Auth
-- =========================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede que o próprio usuário promova a si mesmo a barbeiro/admin,
-- ou ajuste sua comissão, por uma chamada autenticada comum.
-- Apenas requisições feitas com a service role key podem alterar esses campos.
create function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.is_admin := old.is_admin;
    new.commission_percent := old.commission_percent;
  end if;
  return new;
end;
$$;

create trigger protect_profile_privileges_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- =========================================================
-- Função auxiliar para políticas de admin (evita recursão de RLS)
-- =========================================================

create function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.barber_schedules enable row level security;
alter table public.barber_time_off enable row level security;
alter table public.appointments enable row level security;
alter table public.notification_log enable row level security;

-- profiles
create policy "profiles_select_own_or_barbers_or_admin"
  on public.profiles for select
  using (
    id = auth.uid()
    or role = 'barber'
    or public.is_admin_user()
  );

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin_user());

-- services: leitura pública, escrita só admin
create policy "services_select_all"
  on public.services for select
  using (true);

create policy "services_write_admin"
  on public.services for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- horários e folgas: leitura pública, escrita do próprio barbeiro ou admin
create policy "barber_schedules_select_all"
  on public.barber_schedules for select
  using (true);

create policy "barber_schedules_write_own_or_admin"
  on public.barber_schedules for all
  using (barber_id = auth.uid() or public.is_admin_user())
  with check (barber_id = auth.uid() or public.is_admin_user());

create policy "barber_time_off_select_all"
  on public.barber_time_off for select
  using (true);

create policy "barber_time_off_write_own_or_admin"
  on public.barber_time_off for all
  using (barber_id = auth.uid() or public.is_admin_user())
  with check (barber_id = auth.uid() or public.is_admin_user());

-- appointments
create policy "appointments_select_own_or_admin"
  on public.appointments for select
  using (
    client_id = auth.uid()
    or barber_id = auth.uid()
    or public.is_admin_user()
  );

create policy "appointments_insert_own_client"
  on public.appointments for insert
  with check (client_id = auth.uid());

create policy "appointments_update_own_or_admin"
  on public.appointments for update
  using (
    client_id = auth.uid()
    or barber_id = auth.uid()
    or public.is_admin_user()
  );

-- notification_log: apenas leitura para admin/barbeiro dono do agendamento; escrita via service role
create policy "notification_log_select_admin_or_barber"
  on public.notification_log for select
  using (
    public.is_admin_user()
    or exists (
      select 1 from public.appointments a
      where a.id = notification_log.appointment_id
        and a.barber_id = auth.uid()
    )
  );

create policy "notification_log_insert_service_role"
  on public.notification_log for insert
  with check (auth.role() = 'service_role');
