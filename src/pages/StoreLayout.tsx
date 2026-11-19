import { Outlet } from 'react-router-dom'
import { CartDrawer } from '../components/store/CartDrawer'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'

export default function StoreLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
