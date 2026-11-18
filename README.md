# HILLUTEC — loja virtual

Loja de acessórios eletrônicos (carregadores, cabos, fones, power banks e outros), feita com **React + Vite + TypeScript + Tailwind CSS**, pensada primeiro para o celular.

> **Etapa 1 — interface.** Tudo o que aparece no site são **dados de exemplo**. Ainda não há banco de dados (Supabase), integração real com o WhatsApp nem publicação.

## O que já funciona

**Loja (`/`)**
- Cabeçalho com menu (vira menu sanfona no celular) e botão do carrinho.
- Boas-vindas, vantagens, categorias, catálogo e apresentação da loja.
- Catálogo em cards com foto (ou ilustração no lugar da foto), nome, descrição, preço, promoção e disponibilidade.
- Busca, filtro por categoria, ordenação e filtro "só disponíveis".
- Detalhes do produto, botões **Tenho interesse** e **Comprar**, e carrinho com quantidades.

**Painel administrativo (`/admin`)**
- Tela de login (demonstração: `admin@hillutec.demo` / `demo1234`).
- Resumo do estoque, busca e filtro, lista de produtos (tabela no computador, lista no celular).
- Cadastrar, editar (com envio de foto) e excluir produtos, e restaurar os exemplos.

Nesta etapa, as alterações do painel ficam salvas só no navegador (localStorage).

## Rodar no computador

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

## Estrutura

```
src/
  components/
    ui/        componentes genéricos (Button, Badge, Field, Modal, ...)
    store/     componentes da loja (ProductCard, CartDrawer, ...)
    admin/     componentes do painel (ProductForm, StatCard, ...)
    layout/    cabeçalho, rodapé e aviso de demonstração
  context/     estado: produtos, carrinho, login e avisos
  data/        categorias e produtos de exemplo
  pages/       páginas da loja e do painel
```

## Próximas etapas

- Banco de dados e login reais com Supabase (só a camada em `src/context/` muda).
- Envio do pedido e do interesse pelo WhatsApp (`src/components/store/useProductActions.ts` e `CartDrawer.tsx`).
- Publicação.
