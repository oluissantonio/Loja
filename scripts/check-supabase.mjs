/**
 * Verifica a conexão da loja com o Supabase usando SOMENTE a chave pública.
 *
 *   npm run check:supabase
 *
 * Lê VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY)
 * do ambiente ou do arquivo .env.local. Não altera nenhum dado: as tentativas de
 * escrita abaixo DEVEM ser bloqueadas pelas regras de segurança.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* arquivo opcional */ }
}
loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('✗ Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })
let failures = 0
const ok = (msg) => console.log('✓', msg)
const fail = (msg) => { failures++; console.log('✗', msg) }

// 1. Conexão e leitura
const cats = await db.from('categories').select('slug, name').order('sort_order')
if (cats.error) fail(`Leitura das categorias: ${cats.error.message}`)
else ok(`Conexão OK — ${cats.data.length} categorias: ${cats.data.map((c) => c.name).join(', ')}`)

const prods = await db.from('products').select('id, name, price, stock, status, image_path')
if (prods.error) fail(`Leitura dos produtos: ${prods.error.message}`)
else {
  ok(`${prods.data.length} produtos visíveis para visitantes`)
  for (const p of prods.data) {
    const disp = p.stock <= 0 ? 'Esgotado' : p.stock <= 5 ? 'Últimas unidades' : 'Em estoque'
    console.log(`   • ${p.name} — R$ ${Number(p.price).toFixed(2).replace('.', ',')} — estoque ${p.stock} (${disp})${p.image_path ? ' — com foto' : ''}`)
  }
  const inactive = prods.data.filter((p) => p.status !== 'ativo')
  if (inactive.length) fail(`Produtos inativos visíveis ao público: ${inactive.map((p) => p.name).join(', ')}`)
  else ok('Nenhum produto inativo visível ao público')
}

// 2. Segurança: visitante não pode alterar nada
const target = prods.data?.[0]
const ins = await db.from('products').insert({ name: 'teste-invasor', price: 1, category_id: '00000000-0000-0000-0000-000000000000' })
ins.error ? ok('Visitante NÃO consegue cadastrar produtos') : fail('Visitante conseguiu cadastrar um produto!')

if (target) {
  const upd = await db.from('products').update({ price: 0.01, stock: 999 }).eq('id', target.id).select()
  !upd.error && upd.data.length === 0 || upd.error ? ok('Visitante NÃO consegue alterar preço/estoque') : fail('Visitante conseguiu alterar um produto!')
  const del = await db.from('products').delete().eq('id', target.id).select()
  !del.error && del.data.length === 0 || del.error ? ok('Visitante NÃO consegue excluir produtos') : fail('Visitante conseguiu excluir um produto!')
}

const catIns = await db.from('categories').insert({ slug: 'teste-invasor', name: 'x' })
catIns.error ? ok('Visitante NÃO consegue criar categorias') : fail('Visitante conseguiu criar uma categoria!')

const admins = await db.from('admins').select('*')
admins.error || admins.data.length === 0 ? ok('Lista de administradores não é exposta') : fail('Lista de administradores está exposta!')

const up = await db.storage.from('product-images').upload(`teste-invasor-${Date.now()}.png`, new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }))
up.error ? ok('Visitante NÃO consegue enviar fotos') : fail('Visitante conseguiu enviar uma foto!')

console.log(failures ? `\n${failures} problema(s) encontrado(s).` : '\nTudo certo!')
process.exit(failures ? 1 : 0)
