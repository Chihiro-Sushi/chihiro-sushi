'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Pedido, EstadoPedido } from '@/types'

function reproducirNotificacion() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime

    function nota(freq: number, inicio: number, duracion: number) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + inicio)
      gain.gain.setValueAtTime(0, now + inicio)
      gain.gain.linearRampToValueAtTime(0.35, now + inicio + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + inicio + duracion)
      osc.start(now + inicio)
      osc.stop(now + inicio + duracion)
    }

    nota(880, 0, 0.45)    // A5 — primer tono
    nota(587, 0.28, 0.55) // D5 — segundo tono

    if (ctx.state === 'suspended') ctx.resume()
  } catch {
    // AudioContext no disponible
  }
}

export function usePedidosRealtime(filtroEstado?: EstadoPedido) {
  const [todos, setTodos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const idsConocidos = useRef<Set<string> | null>(null)

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
          reproducirNotificacion()
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
