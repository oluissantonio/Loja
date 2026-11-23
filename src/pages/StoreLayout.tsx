import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { enableSmoothAnchors } from '../lib/smoothScroll'
import { CartDrawer } from '../components/store/CartDrawer'
import { PurchaseDialog } from '../components/store/PurchaseDialog'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'

export default function StoreLayout() {
  useEffect(() => enableSmoothAnchors(), [])

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <PurchaseDialog />
    </div>
  )
}
