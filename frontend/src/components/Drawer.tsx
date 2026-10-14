import { NavLink } from 'react-router-dom'

export interface DrawerLink {
  to: string
  label: string
  badge?: number
}

export function drawerLinksFor(rol: string): DrawerLink[] {
  switch (rol) {
    case 'administrador':
      return [
        { to: '/admin', label: 'Inicio' },
        { to: '/admin/platillos', label: 'Platillos' },
        { to: '/admin/menu', label: 'Menú del día' },
        { to: '/admin/usuarios', label: 'Usuarios' },
      ]
    case 'cajero':
      return [
        { to: '/caja', label: 'Caja' },
        { to: '/caja/entregas', label: 'Entregas' },
      ]
    case 'cocinero':
      return [{ to: '/cocina', label: 'Pedidos' }]
    default:
      return [
        { to: '/menu', label: 'Menú del día' },
        { to: '/mis-pedidos', label: 'Mis pedidos' },
      ]
  }
}

export default function Drawer({
  open,
  onClose,
  links,
  userName,
  userRol,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  links: DrawerLink[]
  userName: string
  userRol: string
  onLogout: () => void
}) {
  return (
    <>
      {open && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-outline-soft bg-card p-4 transition-transform md:static md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú de navegación"
      >
        <p className="font-bold">{userName}</p>
        <p className="text-sm text-ink-soft">{userRol}</p>
        <nav className="mt-4 flex flex-col gap-1" aria-label="Secciones">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center justify-between rounded-lg px-4 font-bold ${
                  isActive ? 'bg-primary text-on-primary' : 'text-primary'
                }`
              }
            >
              <span>{l.label}</span>
              {l.badge !== undefined && l.badge > 0 && (
                <span className="rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white">
                  {l.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <button className="btn-secondary mt-6 w-full" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </aside>
    </>
  )
}
