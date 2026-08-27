-- Permite um único agendamento ter vários serviços vinculados (ex: "Corte + Barba"),
-- em vez de criar um agendamento separado por serviço.
create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id),
  service_name text not null,
  price numeric(10,2) not null,
  duration_minutes int not null,
  created_at timestamptz not null default now()
);

create index appointment_services_appointment_id_idx on public.appointment_services(appointment_id);

alter table public.appointment_services enable row level security;

create policy "appointment_services_select"
  on public.appointment_services for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.client_id = auth.uid() or a.barber_id = auth.uid() or public.is_admin_user())
    )
  );

create policy "appointment_services_insert"
  on public.appointment_services for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.client_id = auth.uid() or public.is_admin_user())
    )
  );
