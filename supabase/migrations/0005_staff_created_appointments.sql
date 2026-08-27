-- Permite que o próprio barbeiro ou um admin criem agendamentos em nome de um
-- cliente (ex: agendamento feito no balcão). Antes só existia
-- "appointments_insert_own_client" (client_id = auth.uid()).
create policy "appointments_insert_staff"
  on public.appointments for insert
  with check (barber_id = auth.uid() or public.is_admin_user());
