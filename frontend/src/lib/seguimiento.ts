import { api } from './api'

export interface DetallePedido {
  menuDiaId: number
  nombre: string
  cantidad: number
  precioUnitario: string
  subtotal: string
}

export interface MiPedido {
  id: number
  numero: string
  tipo: string
  estado: string
  total: string
  fechaRecoleccion: string | null
  detalle: DetallePedido[]
  pagoReferencia: string | null
}

export interface Aviso {
  id: number
  pedidoId: number
  numero: string
  tipo: string
  leida: boolean
  fecha: string
}

export function misPedidos(): Promise<{ pedidos: MiPedido[] }> {
  return api('/api/pedidos/mios')
}

export function misAvisos(): Promise<{ avisos: Aviso[] }> {
  return api('/api/avisos')
}

export function marcarVista(avisoId: number): Promise<{ aviso: Aviso }> {
  return api(`/api/avisos/${avisoId}/leida`, { method: 'PATCH' })
}
