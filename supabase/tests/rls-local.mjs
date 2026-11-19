/**
 * Teste completo das regras de segurança contra o Supabase LOCAL (Docker).
 *
 *   npx supabase start
 *   npm run test:rls
 *
 * Cria dados e usuários de teste temporários e apaga tudo no final.
 * Nunca rode contra o projeto de produção: usa a chave secreta do ambiente local.
 */
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  execSync('npx supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
const URL = env.API_URL
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error('Este teste só roda contra o Supabase local.')

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const service = createClient(URL, env.SERVICE_ROLE_KEY, opts)
const anon = createClient(URL, env.ANON_KEY, opts)

let failures = 0
const check = (cond, msg) => { console.log(cond ? '✓' : '✗', msg); if (!cond) failures++ }
const must = ({ data, error }) => { if (error) throw error; return data }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tag = `teste-${Date.now()}`

async function userClient(email, admin) {
  const password = 'Senha-de-teste-123'
  const u = must(await service.auth.admin.createUser({ email, password, email_confirm: true })).user
  if (admin) must(await service.from('admins').insert({ user_id: u.id }))
  const c = createClient(URL, env.ANON_KEY, opts)
  must(await c.auth.signInWithPassword({ email, password }))
  return { c, id: u.id }
}

const cats = must(await service.from('categories').select('id, slug'))
const catId = (slug) => cats.find((c) => c.slug === slug).id
const hidden = must(await service.from('categories').insert({ slug: `${tag}-oculta`, name: 'Oculta', is_active: false }).select().single())

const rows = must(await service.from('products').insert([
  { name: `${tag} ativo estoque 10`, price: 79.9, stock: 10, category_id: catId('carregadores') },
  { name: `${tag} ativo estoque 3`, price: 39.9, compare_at_price: 49.9, stock: 3, category_id: catId('cabos-acessorios') },
  { name: `${tag} ativo estoque 0`, price: 189.9, stock: 0, category_id: catId('fones') },
  { name: `${tag} INATIVO`, price: 99.9, stock: 10, status: 'inativo', category_id: catId('power-banks') },
  { name: `${tag} categoria oculta`, price: 9.9, stock: 10, category_id: hidden.id },
], { defaultToNull: false }).select())
const byName = (s) => rows.find((r) => r.name.endsWith(s))

const admin = await userClient(`${tag}-admin@teste.local`, true)
const comum = await userClient(`${tag}-comum@teste.local`, false)

try {
  console.log('\n— Leitura pública (visitante)')
  const pub = must(await anon.from('products').select('name, price, stock, status').like('name', `${tag}%`))
  check(pub.length === 3, `visitante vê só os 3 produtos ativos (viu ${pub.length})`)
  check(!pub.some((p) => p.name.includes('INATIVO')), 'produto inativo não aparece')
  check(!pub.some((p) => p.name.includes('oculta')), 'produto de categoria inativa não aparece')
  check(Number(pub.find((p) => p.name.includes('estoque 10')).price) === 79.9, 'preço exibido conforme cadastrado (79,90)')
  check(pub.find((p) => p.name.includes('estoque 0')).stock === 0, 'produto com estoque 0 é retornado (aparece como esgotado)')
  const pubCats = must(await anon.from('categories').select('slug'))
  check(!pubCats.some((c) => c.slug === hidden.slug), 'categoria inativa não aparece')
  check(['carregadores', 'cabos-acessorios', 'fones', 'power-banks', 'outros-eletronicos'].every((s) => pubCats.some((c) => c.slug === s)), 'as 5 categorias iniciais existem')

  console.log('\n— Escrita bloqueada para visitante e para usuário logado sem permissão')
  const alvo = byName('estoque 10')
  for (const [quem, c] of [['visitante', anon], ['usuário comum', comum.c]]) {
    const ins = await c.from('products').insert({ name: 'invasor', price: 1, category_id: catId('fones') })
    check(!!ins.error, `${quem} não cadastra produto`)
    await c.from('products').update({ price: 0.01, stock: 999 }).eq('id', alvo.id)
    await c.from('products').delete().eq('id', alvo.id)
    const depois = must(await service.from('products').select('price, stock').eq('id', alvo.id).single())
    check(Number(depois.price) === 79.9 && depois.stock === 10, `${quem} não altera preço/estoque nem exclui`)
    const vis = must(await c.from('products').select('id').eq('id', byName('INATIVO').id))
    check(vis.length === 0, `${quem} não vê produto inativo`)
    check(!!(await c.from('categories').insert({ slug: `${tag}-x`, name: 'x' })).error, `${quem} não cria categoria`)
    check(!!(await c.from('admins').insert({ user_id: comum.id })).error, `${quem} não se promove a administrador`)
    const up = await c.storage.from('product-images').upload(`${alvo.id}/invasor.png`, new Blob([new Uint8Array(8)], { type: 'image/png' }))
    check(!!up.error, `${quem} não envia fotos`)
  }

  console.log('\n— Administrador autorizado')
  const all = must(await admin.c.from('products').select('id').like('name', `${tag}%`))
  check(all.length === 5, `admin vê todos os produtos, inclusive inativos (viu ${all.length})`)
  const novo = must(await admin.c.from('products').insert({ name: `${tag} criado pelo admin`, price: 10, stock: 2, category_id: catId('fones') }).select().single())
  check(!!novo.id, 'admin cadastra produto')
  await sleep(1100)
  const upd = must(await admin.c.from('products').update({ price: 12.5 }).eq('id', novo.id).select().single())
  check(Number(upd.price) === 12.5, 'admin altera preço')
  check(new Date(upd.updated_at) > new Date(upd.created_at), 'updated_at é atualizado automaticamente')
  const path = `${novo.id}/foto.png`
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
  const up = await admin.c.storage.from('product-images').upload(path, new Blob([png], { type: 'image/png' }), { upsert: true })
  check(!up.error, `admin envia foto (${up.error?.message ?? 'ok'})`)
  must(await admin.c.from('products').update({ image_path: path }).eq('id', novo.id))
  const publicUrl = anon.storage.from('product-images').getPublicUrl(path).data.publicUrl
  const res = await fetch(publicUrl)
  check(res.status === 200, `foto acessível publicamente pelo endereço (${res.status})`)
  const txt = await admin.c.storage.from('product-images').upload(`${novo.id}/x.txt`, new Blob(['x'], { type: 'text/plain' }))
  check(!!txt.error, 'bucket recusa arquivos que não são imagem')
  const rm = await admin.c.storage.from('product-images').remove([path])
  check(!rm.error && rm.data.length === 1, 'admin apaga foto')
  must(await admin.c.from('products').delete().eq('id', novo.id))
  check(must(await service.from('products').select('id').eq('id', novo.id)).length === 0, 'admin exclui produto')

  console.log('\n— Tempo real')
  let recebido = false
  const ch = anon.channel(`t-${tag}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, () => { recebido = true })
  await new Promise((r) => ch.subscribe((s) => s === 'SUBSCRIBED' && r()))
  // Logo após o "supabase start" o Realtime pode levar alguns segundos para
  // começar a entregar eventos: tenta algumas vezes antes de considerar falha.
  for (let tentativa = 0; tentativa < 4 && !recebido; tentativa++) {
    await sleep(1500)
    must(await service.from('products').update({ price: 81 + tentativa }).eq('id', alvo.id))
    for (let i = 0; i < 20 && !recebido; i++) await sleep(250)
  }
  check(recebido, 'visitante recebe a mudança de preço em tempo real')
  await anon.removeChannel(ch)
} finally {
  await service.from('products').delete().like('name', `${tag}%`)
  await service.from('categories').delete().eq('id', hidden.id)
  await service.auth.admin.deleteUser(admin.id)
  await service.auth.admin.deleteUser(comum.id)
}

console.log(failures ? `\n${failures} falha(s).` : '\nTodas as verificações passaram.')
process.exit(failures ? 1 : 0)
