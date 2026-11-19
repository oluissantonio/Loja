-- =============================================================================
-- HILLUTEC — Etapa 2: catálogo de produtos
-- Tabelas, regras de segurança (RLS), armazenamento das fotos e tempo real.
-- Pode ser executado de uma vez no SQL Editor do Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Administradores
-- Só quem estiver nesta tabela pode alterar produtos, categorias e fotos.
-- Estar logado NÃO basta: o usuário precisa ser cadastrado aqui.
-- -----------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admins is 'Usuários autorizados a administrar a loja.';

-- Verifica se quem faz a requisição é administrador.
-- SECURITY DEFINER para conseguir ler public.admins sem expor a tabela.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Atualiza automaticamente a coluna updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Categorias (novas categorias podem ser adicionadas a qualquer momento)
-- -----------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null check (length(trim(name)) between 1 and 60),
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is 'Categorias da loja.';
comment on column public.categories.slug is 'Identificador usado no site (ex.: power-banks).';

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Produtos
-- -----------------------------------------------------------------------------
create type public.product_status as enum ('ativo', 'inativo');

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(trim(name)) between 1 and 120),
  description    text not null default '' check (length(description) <= 2000),
  price          numeric(10, 2) not null check (price >= 0),
  -- Preço "de" opcional, exibido riscado quando há promoção.
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price > price),
  stock          integer not null default 0 check (stock >= 0),
  category_id    uuid not null references public.categories (id) on update cascade on delete restrict,
  -- Caminho da foto no bucket "product-images" (ex.: <id do produto>/foto.jpg).
  image_path     text,
  status         public.product_status not null default 'ativo',
  featured       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.products is 'Produtos da loja.';
comment on column public.products.status is 'Somente produtos "ativo" aparecem no site.';
comment on column public.products.image_path is 'Caminho do arquivo no bucket product-images.';

create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Permissões básicas (as linhas visíveis são decididas pelo RLS abaixo)
-- -----------------------------------------------------------------------------
revoke all on public.admins, public.categories, public.products from anon, authenticated;

grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.admins to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.admins     enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;

-- admins: cada administrador só enxerga o próprio registro. Ninguém altera pela API.
create policy "admin vê o próprio registro"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- categories: o público vê as ativas; administradores veem e alteram todas.
create policy "público vê categorias ativas"
  on public.categories for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "admin cadastra categorias"
  on public.categories for insert to authenticated
  with check ((select public.is_admin()));

create policy "admin altera categorias"
  on public.categories for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin exclui categorias"
  on public.categories for delete to authenticated
  using ((select public.is_admin()));

-- products: o público vê só produtos ativos de categorias ativas.
create policy "público vê produtos ativos"
  on public.products for select to anon, authenticated
  using (
    (
      status = 'ativo'
      and exists (select 1 from public.categories c where c.id = category_id and c.is_active)
    )
    or (select public.is_admin())
  );

create policy "admin cadastra produtos"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));

create policy "admin altera produtos"
  on public.products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin exclui produtos"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Categorias iniciais
-- -----------------------------------------------------------------------------
insert into public.categories (slug, name, sort_order) values
  ('carregadores',       'Carregadores',       1),
  ('cabos-acessorios',   'Cabos e acessórios', 2),
  ('fones',              'Fones de ouvido',    3),
  ('power-banks',        'Power banks',        4),
  ('outros-eletronicos', 'Outros eletrônicos', 5);

-- -----------------------------------------------------------------------------
-- Storage: fotos dos produtos
-- Bucket público para leitura (as fotos aparecem no site); só administradores
-- enviam, trocam ou apagam arquivos. Organização: <id do produto>/<arquivo>.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admin envia fotos de produtos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "admin troca fotos de produtos"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "admin apaga fotos de produtos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Listar os arquivos do bucket fica restrito aos administradores.
-- (As fotos continuam acessíveis pelo endereço público de cada uma.)
create policy "admin lista fotos de produtos"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Tempo real: o site recebe as mudanças de produtos e categorias na hora.
-- O Realtime respeita o RLS: visitantes só recebem o que podem ver.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.products, public.categories;
  end if;
end;
$$;
