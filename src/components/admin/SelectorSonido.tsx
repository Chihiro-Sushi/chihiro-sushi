'use client'

import { useState, useEffect } from 'react'
import { SONIDOS, LS_KEY, SONIDO_DEFAULT, type SonidoId } from '@/lib/sonidos'
import { desbloquearAudio, reproducirSonidoNotificacion } from '@/hooks/usePedidosRealtime'

export default function SelectorSonido() {
  const [seleccionado, setSeleccionado] = useState<SonidoId>(SONIDO_DEFAULT)

  useEffect(() => {
    const guardado = localStorage.getItem(LS_KEY) as SonidoId | null
    if (guardado) setSeleccionado(guardado)
  }, [])

  function elegir(id: SonidoId) {
    desbloquearAudio()
    localStorage.setItem(LS_KEY, id)
    setSeleccionado(id)
    // Previsualizar el sonido seleccionado
    setTimeout(reproducirSonidoNotificacion, 50)
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
        Sonido de notificación
      </h2>
      <div className="flex flex-wrap gap-2">
        {SONIDOS.map((s) => {
          const activo = seleccionado === s.id
          return (
            <button
              key={s.id}
              onClick={() => elegir(s.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: activo ? 'rgba(192,57,43,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activo ? 'rgba(192,57,43,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: activo ? '#F5F5F5' : '#9CA3AF',
              }}
            >
              <span>{s.emoji}</span>
              <span>{s.nombre}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
