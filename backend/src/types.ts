/** Roles válidos del sistema (catálogo `rol`). */
export type RolNombre = 'administrador' | 'cajero' | 'cocinero' | 'usuario'

/** Usuario tal como se expone en respuestas (jamás incluye el hash). */
export interface UsuarioPublico {
  id: number
  nombre: string
  correo: string
  rol: RolNombre
  activo: boolean
}

/** Claims del JWT de sesión. */
export interface AuthClaims {
  sub: number
  rol: RolNombre
}

/** Usuario autenticado disponible en `req.usuario` tras requireAuth. */
export interface RequestUsuario extends UsuarioPublico {}

declare global {
  namespace Express {
    interface Request {
      usuario?: RequestUsuario
    }
  }
}

export const ROLES_OPERATIVOS: RolNombre[] = ['cajero', 'cocinero']
