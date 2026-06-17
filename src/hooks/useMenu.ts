'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Categoria, MenuItem } from '@/types'

export function useMenu() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubCat = onSnapshot(
      collection(db, 'menu_categorias'),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Categoria))
          .filter((c) => c.activa)
          .sort((a, b) => a.orden - b.orden)
        setCategorias(data)
      },
      (err) => {
        console.error('useMenu categorias:', err)
        setError('No se pudo cargar el menú.')
        setCargando(false)
      }
    )

    const unsubItems = onSnapshot(
      collection(db, 'menu_items'),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as MenuItem))
          .sort((a, b) => a.orden - b.orden)
        setItems(data)
        setCargando(false)
      },
      (err) => {
        console.error('useMenu items:', err)
        setError('No se pudo cargar el menú.')
        setCargando(false)
      }
    )

    return () => { unsubCat(); unsubItems() }
  }, [])

  const itemsPorCategoria = (categoriaId: string) =>
    items.filter((i) => i.categoriaId === categoriaId)

  return { categorias, items, itemsPorCategoria, cargando, error }
}
