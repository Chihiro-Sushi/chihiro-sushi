'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
  const primeraVez = useRef(true)
  const idsVistos = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handler = () => desbloquearAudio()
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    primeraVez.current = true
    idsVistos.current = new Set()

    const q = query(collection(db, 'pedidos'), orderBy('creadoEn', 'desc'))

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        // Los pedidos con tarjeta esperando confirmación de pago no deben
        // aparecer en el panel hasta que el webhook de Stripe confirme el pago.
        const pedidos = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => (p as Pedido).estado !== 'esperando_pago') as Pedido[]

        if (!primeraVez.current) {
          const hayNuevo = pedidos.some((p) => !idsVistos.current.has(p.id))
          if (hayNuevo) reproducirSonidoNotificacion()
        }

        idsVistos.current = new Set(pedidos.map((p) => p.id))
        primeraVez.current = false
        setTodos(pedidos)
        setCargando(false)
      },
      (error) => {
        console.error('[usePedidosRealtime]', error)
        setCargando(false)
      }
    )

    return () => unsub()
  }, [])

  const pedidos = filtroEstado
    ? todos.filter((p) => p.estado === filtroEstado)
    : todos

  return { pedidos, cargando }
}
