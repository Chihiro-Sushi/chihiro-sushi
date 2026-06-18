'use client'

import { useState, useEffect } from 'react'
import type { Categoria, MenuItem } from '@/types'

export function useMenu() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        setCategorias(data.categorias)
        setItems(data.items)
      })
      .catch(() => setError('No se pudo cargar el menú.'))
      .finally(() => setCargando(false))
  }, [])

  const itemsPorCategoria = (categoriaId: string) =>
    items.filter((i) => i.categoriaId === categoriaId)

  return { categorias, items, itemsPorCategoria, cargando, error }
}
