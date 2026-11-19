-- =============================================================================
-- OPCIONAL — produtos para testar o catálogo logo após criar o banco.
-- Rode no SQL Editor do Supabase SOMENTE se quiser conferir se tudo funciona.
-- Todos têm "[TESTE]" no nome; para apagar depois, rode a última linha.
-- =============================================================================

insert into public.products (name, description, price, compare_at_price, stock, status, featured, category_id)
select v.name, v.description, v.price, v.compare_at_price, v.stock, v.status::public.product_status, v.featured, c.id
from (values
  ('[TESTE] Carregador USB-C 20W', 'Produto de teste: estoque normal.', 79.90, 99.90, 24, 'ativo', true,  'carregadores'),
  ('[TESTE] Cabo USB-C 1 m',       'Produto de teste: poucas unidades.', 39.90, null, 3,  'ativo', false, 'cabos-acessorios'),
  ('[TESTE] Fone Bluetooth',       'Produto de teste: estoque zerado, deve aparecer como esgotado.', 189.90, null, 0, 'ativo', false, 'fones'),
  ('[TESTE] Power bank 10.000 mAh','Produto de teste: estoque normal.', 119.90, null, 15, 'ativo', false, 'power-banks'),
  ('[TESTE] Produto inativo',      'Produto de teste: NÃO deve aparecer no site.', 49.90, null, 10, 'inativo', false, 'outros-eletronicos')
) as v(name, description, price, compare_at_price, stock, status, featured, slug)
join public.categories c on c.slug = v.slug;

-- Para apagar os produtos de teste:
-- delete from public.products where name like '[TESTE]%';
