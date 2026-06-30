'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Pedido, EstadoPedido } from '@/types'
import { getSonidoActual } from '@/lib/sonidos'

let audioCtx: AudioContext | null = null

export function desbloquearAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return
  }
  try {
    audioCtx = new AudioContext()
  } catch {
    // no disponible
  }
}

export function reproducirSonidoNotificacion() {
  if (!audioCtx || audioCtx.state === 'suspended') return
  try {
    getSonidoActual().tocar(audioCtx)
  } catch {
    // error al reproducir
  }
}

export function usePedidosRealtime(filtroEstado?: EstadoPedido) {
  const [todos, setTodos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const idsConocidos = useRef<Set<string> | null>(null)

  // Desbloquear AudioContext en el primer click del usuario en esta página
  useEffect(() => {
    const handler = () => desbloquearAudio()
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [])

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pedidos')
      if (!res.ok) return
      const data: Pedido[] = await res.json()

      if (idsConocidos.current === null) {
        idsConocidos.current = new Set(data.map((p) => p.id))
      } else {
        const nuevos = data.filter((p) => !idsConocidos.current!.has(p.id!))
        if (nuevos.length > 0) {
          reproducirSonidoNotificacion()
          nuevos.forEach((p) => idsConocidos.current!.add(p.id!))
        }
      }

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
