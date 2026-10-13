import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface CartItem {
  menuDiaId: number
  nombre: string
  precio: number
  cantidad: number
}

export const MAX_POR_LINEA = 20

interface CartState {
  items: CartItem[]
  total: number
  conteo: number
  agregar: (item: Omit<CartItem, 'cantidad'>) => void
  quitar: (menuDiaId: number) => void
  fijarCantidad: (menuDiaId: number, cantidad: number) => void
  limpiar: () => void
}

const CartContext = createContext<CartState | null>(null)

export function CartProvider({ children, initialItems }: { children: ReactNode; initialItems?: CartItem[] }) {
  const [items, setItems] = useState<CartItem[]>(initialItems ?? [])

  const agregar = useCallback((item: Omit<CartItem, 'cantidad'>) => {
    setItems((prev) => {
      const actual = prev.find((i) => i.menuDiaId === item.menuDiaId)
      if (!actual) return [...prev, { ...item, cantidad: 1 }]
      if (actual.cantidad >= MAX_POR_LINEA) return prev
      return prev.map((i) =>
        i.menuDiaId === item.menuDiaId ? { ...i, cantidad: i.cantidad + 1 } : i,
      )
    })
  }, [])

  const quitar = useCallback((menuDiaId: number) => {
    setItems((prev) => prev.filter((i) => i.menuDiaId !== menuDiaId))
  }, [])

  const fijarCantidad = useCallback((menuDiaId: number, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.menuDiaId !== menuDiaId)
        : prev.map((i) =>
            i.menuDiaId === menuDiaId
              ? { ...i, cantidad: Math.min(MAX_POR_LINEA, cantidad) }
              : i,
          ),
    )
  }, [])

  const limpiar = useCallback(() => setItems([]), [])

  const { total, conteo } = useMemo(() => {
    return {
      total: items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
      conteo: items.reduce((acc, i) => acc + i.cantidad, 0),
    }
  }, [items])

  const value = useMemo(
    () => ({ items, total, conteo, agregar, quitar, fijarCantidad, limpiar }),
    [items, total, conteo, agregar, quitar, fijarCantidad, limpiar],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartState {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart requiere <CartProvider>')
  return ctx
}
