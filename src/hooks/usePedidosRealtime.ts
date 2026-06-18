'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Pedido, EstadoPedido } from '@/types'

export function usePedidosRealtime(filtroEstado?: EstadoPedido) {
  const [todos, setTodos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pedidos')
      if (!res.ok) return
      const data: Pedido[] = await res.json()
      setTodos(data)
    } catch (err) {
      console.error('[usePedidosRealtime]', err)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    fetchPedidos()
    const interval = setInterval(fetchPedidos, 30000)
    return () => clearInterval(interval)
  }, [fetchPedidos])

  const pedidos = filtroEstado
    ? todos.filter((p) => p.estado === filtroEstado)
    : todos

  return { pedidos, cargando }
}
