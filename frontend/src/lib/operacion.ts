import { api } from './api'

export interface LineaCola {
  nombre: string
  cantidad: number
}

export interface PedidoCola {
  id: number
  numero: string
  tipo: 'anticipado' | 'mostrador'
  estado: string
  cliente: string
  esperaMinutos: number
  creadoEn: string
  total: string
  fechaRecoleccion: string | null
  lineas: LineaCola[]
}

export const SONDEO_MS = 10_000

export function colaCocina(): Promise<{ pedidos: PedidoCola[] }> {
  return api('/api/cocina/cola')
}

export function listosCaja(): Promise<{ pedidos: PedidoCola[] }> {
  return api('/api/caja/listos')
}

export function cambiarEstadoPedido(id: number, estado: string): Promise<{ pedido: unknown }> {
  return api(`/api/pedidos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export function crearMostrador(input: {
  items: Array<{ menuDiaId: number; cantidad: number }>
  clienteNombre?: string
  montoRecibido: number
}): Promise<{ pedido: { id: number; numero: string; estado: string; total: string }; cambio: string }> {
  return api('/api/pedidos/mostrador', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
