-- Detalhes extras do serviço para o modal de seleção do cliente:
-- foto e descrição do que está incluso.
alter table public.services
  add column if not exists image_url text,
  add column if not exists included_items text;
