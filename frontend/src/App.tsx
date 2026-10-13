import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleLayout from './components/RoleLayout'
import { AuthProvider } from './lib/auth'
import { CartProvider } from './lib/carrito'
import AccessDenied from './pages/auth/AccessDenied'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Admin from './pages/admin/Admin'
import Checkout from './pages/clientes/Checkout'
import Confirmacion from './pages/clientes/Confirmacion'
import Menu from './pages/clientes/Menu'
import Placeholder from './pages/Placeholder'

function conRol(roles: ('administrador' | 'cajero' | 'cocinero' | 'usuario')[], pagina: React.ReactNode) {
  return (
    <ProtectedRoute allowed={roles}>
      <RoleLayout>{pagina}</RoleLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/sin-acceso" element={<AccessDenied />} />
        <Route path="/admin/*" element={conRol(['administrador'], <Admin />)} />
        <Route path="/caja" element={conRol(['cajero'], <Placeholder titulo="Caja" />)} />
        <Route path="/cocina" element={conRol(['cocinero'], <Placeholder titulo="Cocina" />)} />
        <Route path="/menu" element={conRol(['usuario'], <Menu />)} />
        <Route path="/pedido/nuevo" element={conRol(['usuario'], <Checkout />)} />
        <Route path="/pedido/:id" element={conRol(['usuario'], <Confirmacion />)} />
        <Route path="/mis-pedidos" element={conRol(['usuario'], <Placeholder titulo="Mis pedidos" />)} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="*"
          element={
            <main className="mx-auto max-w-xl p-6">
              <h1 className="font-display text-xl font-bold">Página no encontrada</h1>
            </main>
          }
        />
      </Routes>
      </CartProvider>
    </AuthProvider>
  )
}
