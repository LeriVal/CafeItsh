import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface CapturaItem {
  menuDiaId: number
  nombre: string
  precio: number
  cantidad: number
}

export const MAX_CAPTURA = 20

interface CapturaState {
  items: CapturaItem[]
  total: number
  conteo: number
  cliente: string
  fijarCliente: (nombre: string) => void
  agregar: (item: Omit<CapturaItem, 'cantidad'>, cantidad: number) => void
  fijarCantidad: (menuDiaId: number, cantidad: number) => void
  quitar: (menuDiaId: number) => void
  limpiar: () => void
}

const CapturaContext = createContext<CapturaState | null>(null)

export function CapturaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CapturaItem[]>([])
  const [cliente, setCliente] = useState('')

  const fijarCliente = useCallback((nombre: string) => setCliente(nombre), [])

  const agregar = useCallback((item: Omit<CapturaItem, 'cantidad'>, cantidad: number) => {
    if (cantidad < 1) return
    setItems((prev) => {
      const actual = prev.find((i) => i.menuDiaId === item.menuDiaId)
      if (!actual) return [...prev, { ...item, cantidad: Math.min(MAX_CAPTURA, cantidad) }]
      return prev.map((i) =>
        i.menuDiaId === item.menuDiaId
          ? { ...i, cantidad: Math.min(MAX_CAPTURA, i.cantidad + cantidad) }
          : i,
      )
    })
  }, [])

  const fijarCantidad = useCallback((menuDiaId: number, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.menuDiaId !== menuDiaId)
        : prev.map((i) =>
            i.menuDiaId === menuDiaId ? { ...i, cantidad: Math.min(MAX_CAPTURA, cantidad) } : i,
          ),
    )
  }, [])

  const quitar = useCallback((menuDiaId: number) => {
    setItems((prev) => prev.filter((i) => i.menuDiaId !== menuDiaId))
  }, [])

  const limpiar = useCallback(() => {
    setItems([])
    setCliente('')
  }, [])

  const { total, conteo } = useMemo(
    () => ({
      total: items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
      conteo: items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    [items],
  )

  const value = useMemo(
    () => ({ items, total, conteo, cliente, fijarCliente, agregar, fijarCantidad, quitar, limpiar }),
    [items, total, conteo, cliente, fijarCliente, agregar, fijarCantidad, quitar, limpiar],
  )
  return <CapturaContext.Provider value={value}>{children}</CapturaContext.Provider>
}

export function useCaptura(): CapturaState {
  const ctx = useContext(CapturaContext)
  if (!ctx) throw new Error('useCaptura requiere <CapturaProvider>')
  return ctx
}
