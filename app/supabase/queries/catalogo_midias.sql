create table if not exists public.catalogo_midias (
  id uuid primary key default gen_random_uuid(),
  catalogo_item_id uuid not null references public.catalogo_itens(id) on delete cascade,
  titulo text,
  imagem_url text not null,
  link_url text,
  ativo boolean not null default true,
  prioridade integer not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (catalogo_item_id)
);

create index if not exists catalogo_midias_item_idx
on public.catalogo_midias(catalogo_item_id, ativo, prioridade);

alter table public.catalogo_midias enable row level security;

drop policy if exists catalogo_midias_read_authenticated on public.catalogo_midias;
create policy catalogo_midias_read_authenticated
on public.catalogo_midias for select
to authenticated
using (true);

drop policy if exists catalogo_midias_read_anon on public.catalogo_midias;
create policy catalogo_midias_read_anon
on public.catalogo_midias for select
to anon
using (ativo = true);

drop policy if exists admin_manage_catalogo_midias on public.catalogo_midias;
create policy admin_manage_catalogo_midias
on public.catalogo_midias for all
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.role = 'admin'
  )
);

drop trigger if exists catalogo_midias_set_atualizado_em on public.catalogo_midias;
create trigger catalogo_midias_set_atualizado_em
before update on public.catalogo_midias
for each row execute function public.set_atualizado_em();

grant select on public.catalogo_midias to anon, authenticated, service_role;
grant insert, update, delete on public.catalogo_midias to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogo-fotos',
  'catalogo-fotos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists catalogo_fotos_public_read on storage.objects;
create policy catalogo_fotos_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'catalogo-fotos');

drop policy if exists admin_manage_catalogo_fotos on storage.objects;
create policy admin_manage_catalogo_fotos
on storage.objects for all
to authenticated
using (bucket_id = 'catalogo-fotos' and public.current_user_is_admin())
with check (bucket_id = 'catalogo-fotos' and public.current_user_is_admin());
