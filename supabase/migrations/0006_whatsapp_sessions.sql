-- Guarda em que passo cada conversa do bot de agendamento pelo WhatsApp está
-- (nome pedido, serviço escolhido, etc). Só o servidor (service role) mexe
-- nessa tabela — não tem policy nenhuma além do RLS ligado (bloqueia tudo
-- que não seja service role).
create table public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  step text not null default 'start',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_sessions enable row level security;
