-- =============================================================================
-- HILLUTEC — Etapa 3: painel administrativo
-- Controle manual de estoque com histórico, e ajustes para o painel.
-- Rode no SQL Editor do Supabase DEPOIS da migração da etapa 2.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Histórico de estoque: toda mudança de estoque fica registrada.
-- -----------------------------------------------------------------------------
create type public.stock_reason as enum ('cadastro', 'entrada', 'venda', 'ajuste', 'correcao');

create table public.stock_movements (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  delta       integer not null,
  stock_after integer not null check (stock_after >= 0),
  reason      public.stock_reason not null,
  note        text check (note is null or length(note) <= 200),
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

comment on table public.stock_movements is 'Histórico das alterações de estoque (só administradores).';

create index stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

revoke all on public.stock_movements from anon, authenticated;
grant select on public.stock_movements to authenticated;

alter table public.stock_movements enable row level security;

create policy "admin vê histórico de estoque"
  on public.stock_movements for select to authenticated
  using ((select public.is_admin()));

-- Registra automaticamente as mudanças de estoque (cadastro, edição ou ajuste).
-- O motivo vem de app.stock_reason (definido por adjust_stock) ou vira "ajuste".
create or replace function public.log_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason public.stock_reason;
  v_note   text;
begin
  if tg_op = 'UPDATE' and new.stock is not distinct from old.stock then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_reason := 'cadastro';
  else
    v_reason := coalesce(nullif(current_setting('app.stock_reason', true), ''), 'ajuste')::public.stock_reason;
  end if;
  v_note := nullif(current_setting('app.stock_note', true), '');

  insert into public.stock_movements (product_id, delta, stock_after, reason, note, created_by)
  values (
    new.id,
    new.stock - case when tg_op = 'INSERT' then 0 else old.stock end,
    new.stock,
    v_reason,
    v_note,
    auth.uid()
  );
  return new;
end;
$$;

revoke all on function public.log_stock_movement() from public, anon, authenticated;

create trigger products_log_stock
  after insert or update of stock on public.products
  for each row execute function public.log_stock_movement();

-- -----------------------------------------------------------------------------
-- Ajuste manual de estoque (entrada, venda, quantidade exata ou correção).
-- SECURITY INVOKER: roda com as permissões de quem chama, então o RLS de
-- products continua valendo. A checagem de administrador abaixo só deixa a
-- mensagem de erro mais clara.
-- -----------------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_mode       text,     -- 'add' (somar), 'remove' (subtrair) ou 'set' (definir)
  p_quantity   integer,
  p_reason     public.stock_reason,
  p_note       text default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current integer;
  v_new     integer;
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem alterar o estoque.' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 0 then
    raise exception 'Quantidade inválida.' using errcode = '22023';
  end if;
  if p_mode not in ('add', 'remove', 'set') then
    raise exception 'Tipo de ajuste inválido.' using errcode = '22023';
  end if;
  if p_reason = 'cadastro' then
    raise exception 'Motivo inválido.' using errcode = '22023';
  end if;

  select stock into v_current from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Produto não encontrado.' using errcode = 'P0002';
  end if;

  v_new := case p_mode
    when 'add' then v_current + p_quantity
    when 'remove' then v_current - p_quantity
    else p_quantity
  end;

  if v_new < 0 then
    raise exception 'Estoque insuficiente: há apenas % unidade(s).', v_current using errcode = '23514';
  end if;
  if v_new > 1000000 then
    raise exception 'Quantidade acima do permitido.' using errcode = '22023';
  end if;

  perform set_config('app.stock_reason', p_reason::text, true);
  perform set_config('app.stock_note', coalesce(left(trim(p_note), 200), ''), true);

  update public.products set stock = v_new where id = p_product_id;
  return v_new;
end;
$$;

revoke all on function public.adjust_stock(uuid, text, integer, public.stock_reason, text) from public, anon;
grant execute on function public.adjust_stock(uuid, text, integer, public.stock_reason, text) to authenticated;

-- Limite de estoque razoável também para cadastros e edições.
alter table public.products add constraint products_stock_max check (stock <= 1000000);
