import { api } from './api'

export interface LineaMenuCliente {
  id: number
  fecha: string
  precio: string
  disponible: boolean
  especial: boolean
  platillo: {
    id: number
    nombre: string
    categoria: string | null
    descripcion: string | null
  }
}

export interface MenuDia {
  fecha: string
  lineas: LineaMenuCliente[]
}

export function fetchMenu(): Promise<MenuDia> {
  return api<MenuDia>('/api/menu')
}
