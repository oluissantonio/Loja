import type { Availability, Category } from '../types'

/**
 * Categorias iniciais (as mesmas criadas no banco pela migração).
 * A loja lê as categorias do Supabase; esta lista é usada apenas pelo painel
 * administrativo de demonstração até ele ser ligado ao banco.
 */
export const CATEGORIES: Category[] = [
  { id: 'carregadores', name: 'Carregadores', short: 'Carregadores' },
  { id: 'cabos-acessorios', name: 'Cabos e acessórios', short: 'Cabos e acessórios' },
  { id: 'fones', name: 'Fones de ouvido', short: 'Fones' },
  { id: 'power-banks', name: 'Power banks', short: 'Power banks' },
  { id: 'outros-eletronicos', name: 'Outros eletrônicos', short: 'Outros eletrônicos' },
]

export const categoryName = (id: string, list: Category[] = CATEGORIES) => list.find((c) => c.id === id)?.name ?? id

export const AVAILABILITY: Record<Availability, { label: string; tone: 'green' | 'amber' | 'blue' | 'gray' }> = {
  'em-estoque': { label: 'Em estoque', tone: 'green' },
  'ultimas-unidades': { label: 'Últimas unidades', tone: 'amber' },
  'ultima-unidade': { label: 'Última unidade', tone: 'amber' },
  'sob-encomenda': { label: 'Sob encomenda', tone: 'blue' },
  esgotado: { label: 'Esgotado', tone: 'gray' },
}
