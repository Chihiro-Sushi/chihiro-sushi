'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { ItemCarrito, MenuItem } from '@/types'

interface EstadoCarrito {
  items: ItemCarrito[]
  total: number
  cantidad: number
}

type AccionCarrito =
  | { type: 'AGREGAR'; payload: { item: MenuItem; variante?: string; cantidad?: number } }
  | { type: 'QUITAR'; payload: { itemId: string; variante?: string } }
  | { type: 'ELIMINAR'; payload: { itemId: string; variante?: string } }
  | { type: 'LIMPIAR' }
  | { type: 'CARGAR'; payload: ItemCarrito[] }

function claveItem(itemId: string, variante?: string) {
  return variante ? `${itemId}__${variante}` : itemId
}

function calcularTotales(items: ItemCarrito[]) {
  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const cantidad = items.reduce((s, i) => s + i.cantidad, 0)
  return { total, cantidad }
}

function reducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
  switch (accion.type) {
    case 'AGREGAR': {
      const { item, variante, cantidad: n = 1 } = accion.payload
      const clave = claveItem(item.id, variante)
      const precio =
        item.precio +
        (variante
          ? (item.variantes?.find((v) => v.nombre === variante)?.precioExtra ?? 0)
          : 0)

      const existente = estado.items.find(
        (i) => claveItem(i.itemId, i.variante) === clave
      )

      const nuevosItems = existente
        ? estado.items.map((i) =>
            claveItem(i.itemId, i.variante) === clave
              ? { ...i, cantidad: i.cantidad + n, subtotal: (i.cantidad + n) * precio }
              : i
          )
        : [
            ...estado.items,
            {
              itemId: item.id,
              nombre: item.nombre,
              variante,
              cantidad: n,
              precioUnitario: precio,
              subtotal: n * precio,
            },
          ]

      return { items: nuevosItems, ...calcularTotales(nuevosItems) }
    }

    case 'QUITAR': {
      const clave = claveItem(accion.payload.itemId, accion.payload.variante)
      const nuevosItems = estado.items
        .map((i) =>
          claveItem(i.itemId, i.variante) === clave
            ? { ...i, cantidad: i.cantidad - 1, subtotal: (i.cantidad - 1) * i.precioUnitario }
            : i
        )
        .filter((i) => i.cantidad > 0)
      return { items: nuevosItems, ...calcularTotales(nuevosItems) }
    }

    case 'ELIMINAR': {
      const clave = claveItem(accion.payload.itemId, accion.payload.variante)
      const nuevosItems = estado.items.filter(
        (i) => claveItem(i.itemId, i.variante) !== clave
      )
      return { items: nuevosItems, ...calcularTotales(nuevosItems) }
    }

    case 'LIMPIAR':
      return { items: [], total: 0, cantidad: 0 }

    case 'CARGAR':
      return { items: accion.payload, ...calcularTotales(accion.payload) }

    default:
      return estado
  }
}

const estadoInicial: EstadoCarrito = { items: [], total: 0, cantidad: 0 }

interface ContextoCarrito extends EstadoCarrito {
  agregar: (item: MenuItem, variante?: string, cantidad?: number) => void
  quitar: (itemId: string, variante?: string) => void
  eliminar: (itemId: string, variante?: string) => void
  limpiar: () => void
}

const CarritoContext = createContext<ContextoCarrito | null>(null)

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial)

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('chihiro_carrito')
      if (guardado) {
        dispatch({ type: 'CARGAR', payload: JSON.parse(guardado) })
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('chihiro_carrito', JSON.stringify(estado.items))
  }, [estado.items])

  const agregar = (item: MenuItem, variante?: string, cantidad = 1) =>
    dispatch({ type: 'AGREGAR', payload: { item, variante, cantidad } })
  const quitar = (itemId: string, variante?: string) =>
    dispatch({ type: 'QUITAR', payload: { itemId, variante } })
  const eliminar = (itemId: string, variante?: string) =>
    dispatch({ type: 'ELIMINAR', payload: { itemId, variante } })
  const limpiar = () => dispatch({ type: 'LIMPIAR' })

  return (
    <CarritoContext.Provider value={{ ...estado, agregar, quitar, eliminar, limpiar }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider')
  return ctx
}
