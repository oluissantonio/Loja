import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CatalogProvider } from './context/CatalogContext'
import { PurchaseProvider } from './context/PurchaseContext'
import { ToastProvider } from './context/ToastContext'
import StoreLayout from './pages/StoreLayout'
import Home from './pages/Home'
import Login from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Products from './pages/admin/Products'
import Categories from './pages/admin/Categories'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ToastProvider>
      <CatalogProvider>
        <CartProvider>
          <PurchaseProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<StoreLayout />}>
                  <Route index element={<Home />} />
                </Route>
                <Route path="admin" element={<Login />} />
                <Route path="admin" element={<AdminLayout />}>
                  <Route path="produtos" element={<Products />} />
                  <Route path="categorias" element={<Categories />} />
                  <Route path="*" element={<Navigate to="/admin/produtos" replace />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
          </PurchaseProvider>
        </CartProvider>
      </CatalogProvider>
    </ToastProvider>
  )
}
