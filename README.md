# HILLUTEC — loja virtual

Loja de acessórios eletrônicos (carregadores, cabos, fones, power banks e outros), feita com **React + Vite + TypeScript + Tailwind CSS**, pensada primeiro para o celular.

> **Etapa 2 — banco de dados.** O catálogo da loja é lido do **Supabase** (banco + fotos no Storage), com regras de segurança (RLS). O painel administrativo ainda é uma demonstração e será ligado ao banco na próxima etapa. WhatsApp, pedidos e pagamentos ainda não existem.

## O que já funciona

**Loja (`/`)**
- Cabeçalho com menu (vira menu sanfona no celular) e botão do carrinho.
- Boas-vindas, vantagens, categorias, catálogo e apresentação da loja.
- **Produtos e categorias vêm do Supabase.** Só aparecem produtos com status `ativo` (de categorias ativas).
- Disponibilidade calculada pelo estoque real: `0` → **Esgotado**, até `5` → **Últimas unidades**, acima disso → **Em estoque**.
- O site se atualiza sozinho quando o banco muda (tempo real), ao voltar para a aba e a cada minuto.
- Busca, filtro por categoria, ordenação, "só disponíveis", detalhes do produto e carrinho (limitado ao estoque).

**Painel administrativo (`/admin`) — demonstração**
- Login de demonstração (`admin@hillutec.demo` / `demo1234`) e gestão de produtos de exemplo, salvos só no navegador. **Não altera a loja.**

## Configurar o Supabase (uma vez)

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New project**. Escolha um nome (ex.: `hillutec`), uma senha forte para o banco (guarde-a) e a região **South America (São Paulo)**.
2. Quando o projeto terminar de criar, abra **SQL Editor → New query**, cole todo o conteúdo de [`supabase/migrations/20261119000000_catalogo.sql`](supabase/migrations/20261119000000_catalogo.sql) e clique em **Run**. Isso cria as tabelas, as 5 categorias, as regras de segurança, o bucket de fotos `product-images` e o tempo real.
3. (Opcional) Para testar com alguns produtos, rode também [`supabase/produtos-de-teste.sql`](supabase/produtos-de-teste.sql). Eles têm `[TESTE]` no nome e podem ser apagados depois.
4. Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up**. Assim ninguém cria conta sozinho; os administradores serão cadastrados por você.
5. Em **Project Settings → API Keys** (ou **Data API**), copie a **Project URL** e a chave pública (**anon** ou **publishable**).
6. Na pasta do projeto, copie `.env.example` para `.env.local` e preencha:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica
   ```

   Nunca use a chave **service_role / secret** no site: ela ignora todas as regras de segurança. O `.env.local` não vai para o GitHub.

## Cadastrar produtos (até o painel ficar pronto)

No Supabase, abra **Table Editor → products → Insert row**:

| Campo | O que colocar |
| --- | --- |
| `name`, `description` | Nome e descrição |
| `price` | Preço de venda (ex.: `79.90`) |
| `compare_at_price` | Opcional: preço antigo, maior que o atual, aparece riscado |
| `stock` | Quantidade em estoque (`0` = esgotado) |
| `category_id` | Escolha a categoria na lista |
| `status` | `ativo` aparece no site, `inativo` fica escondido |
| `featured` | `true` para aparecer primeiro |
| `image_path` | Caminho da foto no Storage (veja abaixo) |

`id`, `created_at` e `updated_at` são preenchidos automaticamente.

**Fotos:** em **Storage → product-images**, crie uma pasta com o `id` do produto e envie a foto (JPG, PNG, WebP ou AVIF, até 5 MB). Depois coloque em `image_path` o caminho, por exemplo `3f2a…/foto.jpg`.

**Novas categorias:** em **Table Editor → categories → Insert row**, preencha `slug` (minúsculas e hífens, ex.: `caixas-de-som`), `name` e `sort_order`. Ela aparece no site automaticamente.

## Segurança (RLS)

- Visitantes e usuários comuns **só leem** produtos ativos e categorias ativas. Não conseguem criar, alterar ou excluir nada, nem enviar fotos.
- Alterações são permitidas apenas a usuários logados **e** cadastrados na tabela `admins`. Estar logado não basta.
- A lista de administradores não é exposta, e ninguém consegue se promover a administrador pela API.
- O navegador usa só a chave pública. A chave secreta nunca entra no código.

Para tornar alguém administrador (será usado na etapa do painel): crie o usuário em **Authentication → Users → Add user** e rode no SQL Editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'email-do-administrador@exemplo.com';
```

## Verificar se está funcionando

```bash
npm run check:supabase
```

Usa a chave pública do `.env.local`, lista os produtos que o público enxerga e confirma que um visitante **não** consegue cadastrar, alterar ou excluir produtos, criar categorias ou enviar fotos. Não altera nenhum dado.

Teste completo das regras com o Supabase local (precisa de Docker):

```bash
npx supabase start
npm run test:rls
```

## Rodar no computador

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173). Sem o `.env.local`, a loja abre normalmente, mas o catálogo mostra o aviso "Catálogo ainda não conectado".

## Estrutura

```
src/
  components/
    ui/        componentes genéricos (Button, Badge, Field, Modal, ...)
    store/     componentes da loja (ProductCard, CartDrawer, ...)
    admin/     componentes do painel (ProductForm, StatCard, ...)
    layout/    cabeçalho, rodapé e aviso de demonstração
  context/     estado: catálogo (Supabase), carrinho, login e avisos
  data/        categorias iniciais e produtos de exemplo do painel demo
  lib/         cliente Supabase, leitura do catálogo e utilitários
  pages/       páginas da loja e do painel
supabase/
  migrations/  estrutura do banco, RLS e Storage
  tests/       teste das regras de segurança (Supabase local)
```

## Próximas etapas

- Painel administrativo e login reais com Supabase (cadastro de produtos e fotos).
- Envio do pedido e do interesse pelo WhatsApp (`src/components/store/useProductActions.ts` e `CartDrawer.tsx`).
- Publicação.
