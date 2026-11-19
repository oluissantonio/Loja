import type { Product } from '../types'

/**
 * DADOS DEMONSTRATIVOS — produtos fictícios usados SOMENTE pelo painel
 * administrativo de demonstração. A loja pública lê os produtos do Supabase.
 */
export const DEMO_PRODUCTS: Product[] = [
  { id: 'demo-01', name: 'Carregador Turbo USB-C 20W', category: 'carregadores', description: 'Carregamento rápido com Power Delivery para celulares e fones. Compacto e com proteção contra superaquecimento.', price: 79.9, oldPrice: 99.9, stock: 24, availability: 'em-estoque', featured: true, demo: true },
  { id: 'demo-02', name: 'Carregador Duplo 35W (USB-C + USB-A)', category: 'carregadores', description: 'Carrega dois aparelhos ao mesmo tempo. Ideal para celular e smartwatch.', price: 129.9, stock: 3, availability: 'ultimas-unidades', demo: true },
  { id: 'demo-03', name: 'Carregador Veicular 30W', category: 'carregadores', description: 'Duas saídas para carregar no carro, com LED discreto.', price: 59.9, stock: 12, availability: 'em-estoque', demo: true },
  { id: 'demo-04', name: 'Cabo USB-C para USB-C 1 m', category: 'cabos-acessorios', description: 'Revestimento em nylon trançado, suporta até 60W e transferência de dados.', price: 39.9, stock: 40, availability: 'em-estoque', featured: true, demo: true },
  { id: 'demo-05', name: 'Cabo USB-C para Lightning 2 m', category: 'cabos-acessorios', description: 'Comprimento extra para usar na cama ou no sofá. Carregamento rápido.', price: 59.9, oldPrice: 69.9, stock: 18, availability: 'em-estoque', demo: true },
  { id: 'demo-06', name: 'Cabo Micro USB Reforçado 1 m', category: 'cabos-acessorios', description: 'Conectores reforçados para uso diário em aparelhos mais antigos.', price: 24.9, stock: 0, availability: 'esgotado', demo: true },
  { id: 'demo-07', name: 'Fone Bluetooth TWS Pro', category: 'fones', description: 'Fone sem fio com cancelamento de ruído, estojo de carga e até 24 h de bateria.', price: 189.9, oldPrice: 229.9, stock: 9, availability: 'em-estoque', featured: true, demo: true },
  { id: 'demo-08', name: 'Headset Gamer com Microfone', category: 'fones', description: 'Som envolvente, microfone articulado e almofadas confortáveis para longas partidas.', price: 219.9, stock: 2, availability: 'ultimas-unidades', demo: true },
  { id: 'demo-09', name: 'Fone Over-ear Bluetooth', category: 'fones', description: 'Graves marcantes, dobrável e com até 40 h de bateria.', price: 249.9, stock: 0, availability: 'sob-encomenda', demo: true },
  { id: 'demo-10', name: 'Power Bank 10.000 mAh Slim', category: 'power-banks', description: 'Fino e leve, cabe no bolso. Duas saídas e indicador de carga.', price: 119.9, stock: 15, availability: 'em-estoque', featured: true, demo: true },
  { id: 'demo-11', name: 'Power Bank 20.000 mAh 22,5W', category: 'power-banks', description: 'Carga rápida e bateria para vários dias. Ideal para viagens.', price: 179.9, oldPrice: 199.9, stock: 6, availability: 'em-estoque', demo: true },
  { id: 'demo-12', name: 'Power Bank Magnético 5.000 mAh', category: 'power-banks', description: 'Encaixa magneticamente na traseira de celulares compatíveis.', price: 149.9, stock: 0, availability: 'sob-encomenda', demo: true },
  { id: 'demo-13', name: 'Suporte Veicular Magnético', category: 'outros-eletronicos', description: 'Fixação firme na saída de ar, giro de 360°.', price: 49.9, stock: 20, availability: 'em-estoque', demo: true },
  { id: 'demo-14', name: 'Adaptador USB-C para P2', category: 'outros-eletronicos', description: 'Use fones com fio em celulares sem entrada P2.', price: 29.9, stock: 4, availability: 'ultimas-unidades', demo: true },
  { id: 'demo-15', name: 'Hub USB-C 4 em 1', category: 'outros-eletronicos', description: 'HDMI 4K, duas portas USB-A e entrada USB-C para carregamento.', price: 159.9, stock: 7, availability: 'em-estoque', demo: true },
]
