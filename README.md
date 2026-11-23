# HILLUTECH — loja virtual

Loja de acessórios eletrônicos (carregadores, cabos, fones, power banks e outros), feita com **React + Vite + TypeScript + Tailwind CSS**, pensada primeiro para o celular.

> **Etapa 3 — painel administrativo.** O catálogo é lido do **Supabase** e o painel `/admin` gerencia produtos, fotos, estoque e categorias de verdade, com login real (Supabase Auth) e regras de segurança (RLS). WhatsApp, pedidos e pagamentos ainda não existem.

## O que já funciona

**Loja (`/`)**
- Produtos e categorias vêm do Supabase. Só aparecem produtos `ativo` de categorias ativas.
- Disponibilidade pelo estoque real: `0` → **Esgotado** (sem botão de compra), `1` → **Última unidade**, até o limite de estoque baixo → **Últimas unidades**, acima → **Em estoque**.
- Atualiza sozinho quando o banco muda.
- **Compra pelo WhatsApp:** "Comprar" (e "Finalizar pedido" no carrinho) abre uma tela de confirmação com produto e preço; "Continuar para o WhatsApp" abre a conversa com a loja (`wa.me/5581999355098`) com a mensagem pronta. "Tenho interesse" faz o mesmo com uma mensagem de dúvida (ou pedido de aviso, se esgotado).
- Nada disso mexe no estoque: o administrador atualiza o estoque no painel depois de confirmar a venda. O número do WhatsApp fica em `src/config/store.ts`.

**Painel (`/admin`)** — só para administradores
- Login com e-mail e senha do Supabase. Contas que não estão na tabela `admins` são recusadas.
- Indicadores reais: produtos cadastrados, ativos, esgotados, estoque baixo e unidades em estoque.
- Busca, filtros (categoria e situação) e ordenação.
- Cadastrar, editar e excluir produtos (nome, descrição, preço, preço antigo, estoque, categoria, status, destaque).
- Fotos: escolher do celular ou computador, ver a prévia, trocar e remover. A foto é reduzida automaticamente (máx. 1600 px, WebP) antes do envio.
- Chave **Ativo/Inativo** para mostrar ou esconder o produto da loja.
- **Estoque manual**: registrar entrada, registrar venda, definir a quantidade exata ou corrigir erro de contagem, com histórico das últimas movimentações.
- **Categorias**: criar, renomear, ocultar, reordenar e excluir (os produtos são movidos para outra categoria antes da exclusão).

**Estoque baixo:** a regra (hoje **2 unidades ou menos**) fica em `src/lib/availability.ts`, na constante `LOW_STOCK_LIMIT`.

## Configurar o Supabase (uma vez)

1. Crie o projeto em [supabase.com](https://supabase.com) (região **South America (São Paulo)**).
2. No **SQL Editor**, rode **em ordem** cada arquivo de [`supabase/migrations/`](supabase/migrations/):
   1. `20261119000000_catalogo.sql` — tabelas, categorias, RLS, fotos e tempo real.
   2. `20261120000000_painel_admin.sql` — controle de estoque com histórico.
3. (Opcional) Rode [`supabase/produtos-de-teste.sql`](supabase/produtos-de-teste.sql) para ter produtos de teste.
4. Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up**.
5. Copie a **Project URL** e a chave pública (**publishable** ou **anon**) para o `.env.local` (veja `.env.example`). Nunca use a chave **secret / service_role** no site.

## Criar o administrador

1. Em **Authentication → Users → Add user → Create new user**, informe o seu e-mail e uma senha forte, marque **Auto Confirm User** e crie.
2. No **SQL Editor**, rode (trocando o e-mail):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com';
   ```

3. Entre em `/admin` com esse e-mail e senha.

Para tirar o acesso de alguém: `delete from public.admins where user_id = (select id from auth.users where email = '...');`

Só quem tem acesso ao painel do Supabase consegue criar administradores. Nenhuma senha fica no código.

## Segurança (RLS)

- Visitantes e usuários comuns **só leem** produtos ativos e categorias ativas. Não conseguem criar, alterar ou excluir nada, mudar estoque, ver o histórico de estoque nem enviar fotos.
- O estoque só muda pelo painel (ou pela função `adjust_stock`, que também exige administrador). Preço e estoque negativos são recusados pelo próprio banco.
- Alterações são permitidas apenas a usuários logados **e** cadastrados na tabela `admins`. Estar logado não basta.
- A lista de administradores não é exposta, e ninguém consegue se promover a administrador pela API.
- O navegador usa só a chave pública. A chave secreta nunca entra no código.

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

## Publicação (Vercel)

O projeto está ligado à Vercel (projeto **hillutech**, endereço **hillutech.vercel.app**). Cada envio para a branch principal do GitHub publica uma versão nova; outras branches geram uma pré-visualização.

| Configuração | Valor |
| --- | --- |
| Framework | Vite (build `npm run build`, saída `dist`) |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (publishable/anon). Nunca a secret/service_role |
| Rotas | `vercel.json` manda todas as rotas para o `index.html` (necessário para `/admin`) |
| Segurança | `vercel.json` envia cabeçalhos de segurança (CSP, bloqueio de moldura/iframe, nosniff etc.) |

No Supabase, em **Authentication → URL Configuration**, use `https://hillutech.vercel.app` como **Site URL**.

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

- Publicação.
