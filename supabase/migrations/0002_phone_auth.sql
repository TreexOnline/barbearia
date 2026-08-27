-- Migra o cadastro para usar telefone (identidade nativa do Supabase Auth)
-- + senha + data de nascimento, em vez de email + nome no cadastro.

alter table public.profiles
  add column if not exists birth_date date;

alter table public.profiles
  add constraint profiles_phone_unique unique (phone);

-- handle_new_user agora lê o telefone real do auth.users (definido via
-- admin.createUser com phone_confirm=true) e a data de nascimento enviada
-- em user_metadata, em vez de derivar tudo de metadata solto.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone,
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date
  );
  return new;
end;
$$;
