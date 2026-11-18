import { useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, Headset, PackageSearch, Search, ShieldCheck, Truck, Zap } from 'lucide-react'
import { CATEGORIES } from '../data/categories'
import { useProducts } from '../context/ProductsContext'
import { CategoryFilter } from '../components/store/CategoryFilter'
import { CategoryIcon } from '../components/store/CategoryIcon'
import { ProductCard } from '../components/store/ProductCard'
import { ProductDetail } from '../components/store/ProductDetail'
import { buttonClass } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { DemoTag } from '../components/ui/DemoTag'
import type { CategoryId, Product } from '../types'

type Sort = 'relevancia' | 'menor-preco' | 'maior-preco' | 'nome'

export default function Home() {
  const { products } = useProducts()
  const [category, setCategory] = useState<CategoryId | 'todos'>('todos')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('relevancia')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  const counts = useMemo(() => products.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }), {}), [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter(
      (p) =>
        (category === 'todos' || p.category === category) &&
        (!onlyAvailable || p.availability === 'em-estoque' || p.availability === 'ultimas-unidades') &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    )
    const rank = (p: Product) => (p.availability === 'esgotado' ? 2 : p.featured ? 0 : 1)
    return [...list].sort((a, b) => {
      if (sort === 'menor-preco') return a.price - b.price
      if (sort === 'maior-preco') return b.price - a.price
      if (sort === 'nome') return a.name.localeCompare(b.name, 'pt-BR')
      return rank(a) - rank(b)
    })
  }, [products, category, query, sort, onlyAvailable])

  const pickCategory = (id: CategoryId) => {
    setCategory(id)
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* Boas-vindas */}
      <section id="inicio" className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 ring-1 ring-inset ring-white/15">
              <Zap className="h-3.5 w-3.5 text-brand-400" /> Tecnologia que acompanha você
            </span>
            <h1 className="mt-5 text-[2.1rem] font-bold leading-[1.1] sm:text-5xl">
              Seja bem-vindo à <span className="text-brand-400">HILLUTEC!</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              Carregadores, cabos, fones, power banks e acessórios com qualidade, preço justo e atendimento de perto.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#produtos" className={buttonClass('primary', 'lg')}>
                Ver produtos <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#sobre" className={buttonClass('light', 'lg') + ' !bg-white/10 !text-white ring-1 ring-inset ring-white/20 hover:!bg-white/15'}>
                Conheça a loja
              </a>
            </div>
          </div>

          <div className="hidden grid-cols-2 gap-3 lg:grid">
            {CATEGORIES.slice(0, 4).map((c, i) => (
              <button key={c.id} onClick={() => pickCategory(c.id)} className={`group rounded-3xl bg-white/[0.06] p-5 text-left ring-1 ring-inset ring-white/10 transition hover:bg-white/10 ${i % 2 ? 'translate-y-6' : ''}`}>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white"><CategoryIcon category={c.id} className="h-6 w-6" /></div>
                <p className="mt-6 font-display font-semibold">{c.name}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/60 group-hover:text-white">Ver opções <ArrowRight className="h-3.5 w-3.5" /></p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            { icon: ShieldCheck, t: 'Garantia', d: '90 dias em todos os itens' },
            { icon: Truck, t: 'Entrega', d: 'Combinada com você' },
            { icon: BadgeCheck, t: 'Qualidade', d: 'Produtos testados' },
            { icon: Headset, t: 'Atendimento', d: 'Rápido e humano' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3 bg-white px-4 py-4 sm:py-5">
              <Icon className="h-6 w-6 shrink-0 text-brand-500" />
              <div>
                <p className="text-sm font-semibold">{t}</p>
                <p className="text-xs text-ink-muted">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section id="categorias" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <SectionTitle eyebrow="Categorias" title="Encontre o que você precisa" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => pickCategory(c.id)} className="group flex flex-col items-start rounded-2xl border border-line bg-white p-4 text-left transition hover:border-brand-200 hover:bg-brand-50 last:col-span-2 sm:last:col-span-1">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white">
                  <CategoryIcon category={c.id} className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-[15px] font-semibold">{c.name}</p>
                <p className="text-xs text-ink-muted">{counts[c.id] ?? 0} produtos</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="produtos" className="scroll-mt-16 bg-slate-50/70">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle eyebrow="Catálogo" title="Nossos produtos" />
            <DemoTag />
          </div>

          <div className="sticky top-16 z-30 -mx-4 mt-6 space-y-3 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="flex gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Buscar produtos</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar produto..."
                  className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-[15px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                />
              </label>
              <label className="relative">
                <span className="sr-only">Ordenar</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 rounded-xl border border-line bg-white px-3 text-sm font-medium focus:border-brand-500 focus:outline-none">
                  <option value="relevancia">Relevância</option>
                  <option value="menor-preco">Menor preço</option>
                  <option value="maior-preco">Maior preço</option>
                  <option value="nome">Nome (A–Z)</option>
                </select>
              </label>
            </div>
            <CategoryFilter value={category} onChange={setCategory} counts={counts} />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
            <span>{visible.length} {visible.length === 1 ? 'produto' : 'produtos'}</span>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4 rounded border-line accent-brand-500" />
              Só disponíveis
            </label>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={<PackageSearch className="h-6 w-6" />} title="Nenhum produto encontrado" text="Tente outra busca ou escolha outra categoria." />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => <ProductCard key={p.id} product={p} onOpen={setSelected} />)}
            </div>
          )}
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="scroll-mt-20 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionTitle eyebrow="Sobre a HILLUTEC" title="Acessórios confiáveis para quem vive conectado" />
            <p className="mt-4 leading-relaxed text-ink-muted">
              A HILLUTEC nasceu para facilitar a escolha de acessórios eletrônicos. Selecionamos carregadores, cabos, fones e power banks que unem
              durabilidade, segurança e bom preço — e explicamos cada produto de forma simples, para você comprar com tranquilidade.
            </p>
            <p className="mt-3 leading-relaxed text-ink-muted">Ficou com dúvida sobre compatibilidade? Fale com a gente antes de comprar: ajudamos você a escolher o item certo.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: '+15', l: 'produtos' },
              { n: '5', l: 'categorias' },
              { n: '90 dias', l: 'de garantia' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-brand-50 p-4 text-center sm:p-6">
                <p className="font-display text-xl font-bold text-navy-900 sm:text-3xl">{s.n}</p>
                <p className="mt-1 text-xs text-ink-muted sm:text-sm">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>
      <h2 className="mt-1.5 text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h2>
    </div>
  )
}
