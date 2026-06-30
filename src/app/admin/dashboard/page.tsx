'use client'

import { useState, useEffect } from 'react'
import { usePedidosRealtime } from '@/hooks/usePedidosRealtime'
import PedidoCard from '@/components/admin/PedidoCard'
import SelectorSonido from '@/components/admin/SelectorSonido'
import { Loader2, Package, CloudRain, Ban } from 'lucide-react'
import type { EstadoPedido } from '@/types'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const FILTROS: { valor: EstadoPedido | 'todos'; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'pendiente', label: 'Pendientes' },
  { valor: 'en_proceso', label: 'En proceso' },
  { valor: 'en_camino', label: 'En camino' },
  { valor: 'entregado', label: 'Entregados' },
  { valor: 'cancelado', label: 'Cancelados' },
]

export default function DashboardPage() {
  const [filtro, setFiltro] = useState<EstadoPedido | 'todos'>('todos')
  const { pedidos, cargando } = usePedidosRealtime(filtro === 'todos' ? undefined : filtro)
  const pendientes = pedidos.filter((p) => p.estado === 'pendiente').length

  const [tarifaClimatica, setTarifaClimatica] = useState(false)
  const [suspension, setSuspension] = useState(false)
  const [guardandoControl, setGuardandoControl] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'configuracion', 'sitio')).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setTarifaClimatica(data.tarifaClimaticaActiva ?? false)
        setSuspension(data.suspensionDelivery ?? false)
      }
    }).catch(() => {})
  }, [])

  async function toggleTarifaClimatica() {
    const nuevo = !tarifaClimatica
    setGuardandoControl(true)
    try {
      await updateDoc(doc(db, 'configuracion', 'sitio'), { tarifaClimaticaActiva: nuevo })
      setTarifaClimatica(nuevo)
    } catch {
      // fail silently
    } finally {
      setGuardandoControl(false)
    }
  }

  async function toggleSuspension() {
    const nuevo = !suspension
    setGuardandoControl(true)
    try {
      await updateDoc(doc(db, 'configuracion', 'sitio'), { suspensionDelivery: nuevo })
      setSuspension(nuevo)
    } catch {
      // fail silently
    } finally {
      setGuardandoControl(false)
    }
  }

  return (
    <div className="p-6">

      <SelectorSonido />

      {/* Control operativo */}
      <div className="mb-6 rounded-xl p-4 space-y-3" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Control operativo</h2>
        <div className="flex flex-col sm:flex-row gap-3">

          <button
            onClick={toggleTarifaClimatica}
            disabled={guardandoControl}
            className="flex items-center gap-3 flex-1 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50"
            style={{
              backgroundColor: tarifaClimatica ? 'rgba(251,176,64,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${tarifaClimatica ? 'rgba(251,176,64,0.35)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <CloudRain size={18} style={{ color: tarifaClimatica ? '#FBB040' : '#9CA3AF', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="text-sm font-medium" style={{ color: tarifaClimatica ? '#FBB040' : '#F5F5F5' }}>
                Tarifa extra por condiciones climáticas
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {tarifaClimatica ? 'Activa — +$10 al costo de envío' : 'Inactiva'}
              </p>
            </div>
            <div className="relative shrink-0 rounded-full transition-colors duration-200"
              style={{ width: 40, height: 22, backgroundColor: tarifaClimatica ? '#FBB040' : 'rgba(255,255,255,0.12)' }}>
              <span className="absolute top-0.5 rounded-full transition-all duration-200"
                style={{
                  left: tarifaClimatica ? 20 : 2,
                  width: 18, height: 18,
                  backgroundColor: '#F5F5F5',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              />
            </div>
          </button>

          <button
            onClick={toggleSuspension}
            disabled={guardandoControl}
            className="flex items-center gap-3 flex-1 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50"
            style={{
              backgroundColor: suspension ? 'rgba(192,57,43,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${suspension ? 'rgba(192,57,43,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <Ban size={18} style={{ color: suspension ? '#C0392B' : '#9CA3AF', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="text-sm font-medium" style={{ color: suspension ? '#C0392B' : '#F5F5F5' }}>
                Suspensión de delivery por condiciones extremas
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {suspension ? 'Activa — pedidos bloqueados' : 'Inactiva'}
              </p>
            </div>
            <div className="relative shrink-0 rounded-full transition-colors duration-200"
              style={{ width: 40, height: 22, backgroundColor: suspension ? '#C0392B' : 'rgba(255,255,255,0.12)' }}>
              <span className="absolute top-0.5 rounded-full transition-all duration-200"
                style={{
                  left: suspension ? 20 : 2,
                  width: 18, height: 18,
                  backgroundColor: '#F5F5F5',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              />
            </div>
          </button>

        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Pedidos en tiempo real</h1>
          {pendientes > 0 && (
            <p className="text-sm mt-0.5" style={{ color: '#FBB040' }}>
              ⚡ {pendientes} pedido{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
          ● En vivo
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
        {FILTROS.map(({ valor, label }) => (
          <button
            key={valor}
            onClick={() => setFiltro(valor)}
            className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: filtro === valor ? '#C0392B' : '#141414',
              color: filtro === valor ? '#F5F5F5' : '#9CA3AF',
              border: `1px solid ${filtro === valor ? '#C0392B' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#C0392B' }} />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Package size={48} style={{ color: 'rgba(156,163,175,0.3)' }} />
          <p style={{ color: '#9CA3AF' }}>No hay pedidos en esta categoría</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pedidos.map((pedido) => (
            <PedidoCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      )}
    </div>
  )
}
