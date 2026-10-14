import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface CartItem {
  menuDiaId: number
  nombre: string
  precio: number
  cantidad: number
}

export const MAX_POR_LINEA = 20

const CLAVE_CARRITO = 'itsh.cart'

function cargarGuardado(): CartItem[] {
  try {
    const crudo = localStorage.getItem(CLAVE_CARRITO)
    if (!crudo) return []
    const datos = JSON.parse(crudo) as unknown
    if (!Array.isArray(datos)) return []
    return datos.filter(
      (d): d is CartItem => {
        const x = d as Partial<CartItem>
        return (
          typeof x.menuDiaId === 'number' &&
          typeof x.nombre === 'string' &&
          typeof x.precio === 'number' &&
          typeof x.cantidad === 'number' &&
          x.cantidad >= 1 &&
          x.cantidad <= MAX_POR_LINEA
        )
      },
    )
  } catch {
    return []
  }
}

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
  const [items, setItems] = useState<CartItem[]>(initialItems ?? cargarGuardado)

  useEffect(() => {
    try {
      if (initialItems === undefined) {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items))
      }
    } catch {
      /* almacenamiento no disponible: el carrito sigue en memoria */
    }
  }, [items, initialItems])

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
