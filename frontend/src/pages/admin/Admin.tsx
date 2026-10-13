import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import RoleLayout from '../../components/RoleLayout'
import MenuDia from './MenuDia'
import Platillos from './Platillos'
import Usuarios from './Usuarios'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[44px] items-center rounded-lg px-4 font-bold ${
    isActive ? 'bg-primary text-on-primary' : 'text-primary'
  }`

export default function Admin() {
  return (
    <RoleLayout>
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Administración">
        <NavLink to="/admin/platillos" className={linkClass}>
          Platillos
        </NavLink>
        <NavLink to="/admin/menu" className={linkClass}>
          Menú del día
        </NavLink>
        <NavLink to="/admin/usuarios" className={linkClass}>
          Usuarios
        </NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="/admin/platillos" replace />} />
        <Route path="platillos" element={<Platillos />} />
        <Route path="menu" element={<MenuDia />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Routes>
    </RoleLayout>
  )
}
