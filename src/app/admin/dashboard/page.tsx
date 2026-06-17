'use client'

import { useState } from 'react'
import { usePedidosRealtime } from '@/hooks/usePedidosRealtime'
import PedidoCard from '@/components/admin/PedidoCard'
import { Loader2, Package } from 'lucide-react'
import type { EstadoPedido } from '@/types'

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

  return (
    <div className="p-6">
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
