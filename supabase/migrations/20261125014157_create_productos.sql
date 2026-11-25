create table public.productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  sku text not null check (char_length(btrim(sku)) between 1 and 80),
  cantidad integer not null default 0 check (cantidad >= 0),
  minimo integer not null default 0 check (minimo >= 0),
  created_at timestamptz not null default now()
);

create index productos_user_id_idx on public.productos (user_id);
create unique index productos_user_sku_unique
  on public.productos (user_id, upper(btrim(sku)));

alter table public.productos enable row level security;
revoke all on public.productos from anon;
grant select, insert, update, delete on public.productos to authenticated;

create policy "Cada persona lee sus productos"
  on public.productos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Cada persona crea sus productos"
  on public.productos for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Cada persona actualiza sus productos"
  on public.productos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Cada persona elimina sus productos"
  on public.productos for delete to authenticated
  using ((select auth.uid()) = user_id);
