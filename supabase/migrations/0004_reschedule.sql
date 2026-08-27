-- Permite registrar notificações de reagendamento (cliente troca o horário).
alter table public.notification_log
  drop constraint notification_log_type_check;

alter table public.notification_log
  add constraint notification_log_type_check
  check (type in ('confirmation', 'reminder', 'cancellation', 'rescheduled'));
