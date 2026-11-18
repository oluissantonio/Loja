import type { Availability, Category } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'carregadores', name: 'Carregadores', short: 'Carregadores' },
  { id: 'cabos', name: 'Cabos', short: 'Cabos' },
  { id: 'fones', name: 'Fones de ouvido', short: 'Fones' },
  { id: 'power-banks', name: 'Power banks', short: 'Power banks' },
  { id: 'acessorios', name: 'Outros acessórios', short: 'Acessórios' },
]

export const categoryName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? id

export const AVAILABILITY: Record<Availability, { label: string; tone: 'green' | 'amber' | 'blue' | 'gray' }> = {
  'em-estoque': { label: 'Em estoque', tone: 'green' },
  'ultimas-unidades': { label: 'Últimas unidades', tone: 'amber' },
  'sob-encomenda': { label: 'Sob encomenda', tone: 'blue' },
  esgotado: { label: 'Esgotado', tone: 'gray' },
}
