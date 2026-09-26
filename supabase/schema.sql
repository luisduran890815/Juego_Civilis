-- Civilis 1.0 · Esquema de guardado anónimo
-- Ejecuta este archivo en Supabase > SQL Editor.

create table if not exists public.civilis_saves (
  id uuid primary key,
  save_token_hash text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint civilis_saves_data_is_object check (jsonb_typeof(data) = 'object')
);

create index if not exists civilis_saves_token_lookup
  on public.civilis_saves (id, save_token_hash);

create or replace function public.set_civilis_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists civilis_saves_updated_at on public.civilis_saves;
create trigger civilis_saves_updated_at
before update on public.civilis_saves
for each row execute function public.set_civilis_updated_at();

-- El navegador nunca accede directamente a esta tabla. La función de Netlify
-- valida una clave secreta por partida y usa la service role del servidor.
alter table public.civilis_saves enable row level security;
revoke all on table public.civilis_saves from anon, authenticated;

comment on table public.civilis_saves is
  'Partidas anónimas de Civilis. save_token_hash contiene SHA-256, nunca la clave original.';
