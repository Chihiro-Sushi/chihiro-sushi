'use client'

import { useState } from 'react'
import { Clock, MapPin, User, Phone, CreditCard, Banknote, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { Pedido, EstadoPedido } from '@/types'

const ESTADOS: { valor: EstadoPedido; label: string; color: string; bg: string }[] = [
  { valor: 'pendiente',   label: 'Pendiente',   color: '#FBB040', bg: 'rgba(251,176,64,0.12)',  },
  { valor: 'en_proceso',  label: 'En proceso',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  },
  { valor: 'en_camino',   label: 'En camino',   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', },
  { valor: 'entregado',   label: 'Entregado',   color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   },
  { valor: 'cancelado',   label: 'Cancelado',   color: '#F87171', bg: 'rgba(248,113,113,0.12)', },
]

interface Props {
  pedido: Pedido
}

export default function PedidoCard({ pedido }: Props) {
  const [expandido, setExpandido] = useState(false)
  const [actualizando, setActualizando] = useState(false)

  const estadoActual = ESTADOS.find((e) => e.valor === pedido.estado) ?? ESTADOS[0]

  async function cambiarEstado(nuevoEstado: EstadoPedido) {
    setActualizando(true)
    try {
      await fetch(`/api/admin/pedidos/${pedido.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
    } finally {
      setActualizando(false)
    }
  }

  function parseFecha(val: unknown): Date | null {
    if (!val) return null
    if (typeof val === 'string') return new Date(val)
    if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate()
    }
    return null
  }

  const fechaObj = parseFecha(pedido.creadoEn)
  const hora = fechaObj?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) ?? '--:--'
  const fecha = fechaObj?.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) ?? null

  const numLabel = pedido.numeroPedido
    ? `#${String(pedido.numeroPedido).padStart(3, '0')}`
    : `#${pedido.id.slice(-4).toUpperCase()}`

  const esPendiente = pedido.estado === 'pendiente'

  return (
    <>
      {esPendiente && (
        <style>{`
          @keyframes parpadeo-pedido {
            0%, 100% { box-shadow: 0 0 0 1px rgba(251,176,64,0.15), 0 0 16px rgba(251,176,64,0.08); }
            50% { box-shadow: 0 0 0 2px rgba(251,176,64,0.5), 0 0 32px rgba(251,176,64,0.28); }
          }
          @keyframes punto-pendiente {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
        `}</style>
      )}
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#141414',
        border: `1px solid ${esPendiente ? 'rgba(251,176,64,0.45)' : 'rgba(255,255,255,0.08)'}`,
        animation: esPendiente ? 'parpadeo-pedido 1.6s ease-in-out infinite' : 'none',
      }}
    >
      {/* Número de pedido — banda superior */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          backgroundColor: esPendiente ? 'rgba(251,176,64,0.1)' : 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="font-black text-base tracking-tight" style={{ color: estadoActual.color }}>
            {numLabel}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: estadoActual.bg, color: estadoActual.color, border: `1px solid ${estadoActual.color}30` }}
          >
            {estadoActual.label}
          </span>
          {esPendiente && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#FBB040', animation: 'punto-pendiente 1.6s ease-in-out infinite', display: 'inline-block' }}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
          <Clock size={11} />
          {fecha && <span>{fecha}</span>}
          <span>{hora}</span>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5" style={{ color: '#F5F5F5' }}>
              <User size={14} style={{ color: '#C0392B' }} />
              <span className="font-semibold text-sm">{pedido.cliente.nombre}</span>
            </div>
            <div className="flex items-start gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
              <MapPin size={12} style={{ color: '#C0392B', flexShrink: 0, marginTop: 1 }} />
              <span className="leading-relaxed">{pedido.cliente.direccion}</span>
            </div>
            {pedido.cliente.coordenadas && (
              <a
                href={`https://www.google.com/maps?q=${pedido.cliente.coordenadas.lat},${pedido.cliente.coordenadas.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 mt-1 hover:underline"
                style={{ color: '#60A5FA' }}
              >
                <MapPin size={11} />
                Ver en Google Maps
              </a>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-lg" style={{ color: '#C0392B' }}>
              ${pedido.total.toFixed(2)}
            </p>
            <p className="text-xs flex items-center gap-1 justify-end mt-0.5" style={{ color: '#9CA3AF' }}>
              {pedido.metodoPago === 'tarjeta'
                ? <><CreditCard size={11} /> Tarjeta</>
                : <><Banknote size={11} /> Efectivo</>}
            </p>
            {pedido.metodoPago === 'efectivo' && pedido.pagoEfectivo && (
              <p className="text-xs mt-0.5 text-right" style={{ color: pedido.pagoEfectivo === 'cambio' ? '#FBB040' : '#9CA3AF' }}>
                {pedido.pagoEfectivo === 'exacto' ? '💰 Pago exacto' : '💵 Necesita cambio'}
              </p>
            )}
          </div>
        </div>

        {/* Resumen rápido de items */}
        <div className="mt-3 text-xs" style={{ color: '#9CA3AF' }}>
          {pedido.items.slice(0, 2).map((item, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              {item.cantidad}× {item.nombre}
            </span>
          ))}
          {pedido.items.length > 2 && (
            <span style={{ color: 'rgba(156,163,175,0.5)' }}> +{pedido.items.length - 2} más</span>
          )}
        </div>

        <button
          onClick={() => setExpandido(!expandido)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs transition-colors hover:opacity-80"
          style={{ color: '#9CA3AF' }}
        >
          {expandido ? <><ChevronUp size={14} /> Ocultar detalle</> : <><ChevronDown size={14} /> Ver detalle</>}
        </button>
      </div>

      {/* Detalle expandible */}
      {expandido && (
        <div
          className="px-4 pb-4 pt-3 space-y-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Lista de items */}
          <div className="space-y-1">
            {pedido.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between text-sm py-1.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span style={{ color: '#9CA3AF' }}>
                  <span style={{ color: '#F5F5F5', fontWeight: 500 }}>{item.cantidad}×</span>{' '}
                  {item.nombre}
                  {item.variante && (
                    <span className="text-xs ml-1" style={{ color: 'rgba(156,163,175,0.5)' }}>
                      ({item.variante})
                    </span>
                  )}
                </span>
                <span style={{ color: '#F5F5F5' }}>${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="text-xs space-y-1" style={{ color: '#9CA3AF' }}>
            {pedido.distanciaKm != null && (
              <div className="flex justify-between">
                <span>📍 Distancia</span>
                <span>{pedido.distanciaKm.toFixed(1)} km</span>
              </div>
            )}
            {pedido.condominio && (
              <div
                className="rounded-lg px-2.5 py-2 space-y-1 my-1"
                style={{ backgroundColor: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.2)' }}
              >
                <div className="flex justify-between font-medium" style={{ color: '#F5F5F5' }}>
                  <span>🏘️ Condominio</span>
                  <span>{pedido.condominio}</span>
                </div>
                {pedido.entradaCondominio && (
                  <div className="flex justify-between">
                    <span>Entrada</span>
                    <span>{pedido.entradaCondominio === 'carretera_federal' ? 'Carretera Federal' : 'La Joya'}</span>
                  </div>
                )}
                {pedido.surcargoCondominio != null && pedido.surcargoCondominio > 0 && (
                  <div className="flex justify-between" style={{ color: '#C0392B' }}>
                    <span>Cargo extra</span>
                    <span>+${pedido.surcargoCondominio.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${pedido.subtotal.toFixed(2)}</span>
            </div>
            {pedido.descuento > 0 && (
              <div className="flex justify-between" style={{ color: '#22C55E' }}>
                <span>Descuento</span>
                <span>-${pedido.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Envío</span>
              <span>${pedido.costoEnvio.toFixed(2)}</span>
            </div>
            {pedido.surcargoClimatico && pedido.surcargoClimatico > 0 ? (
              <div className="flex justify-between" style={{ color: '#FBB040' }}>
                <span>🌧️ Tarifa climática</span>
                <span>+${pedido.surcargoClimatico.toFixed(2)}</span>
              </div>
            ) : null}
            {pedido.metodoPago === 'tarjeta' && pedido.comisionTarjeta ? (
              <div className="flex justify-between">
                <span>💳 Comisión Stripe</span>
                <span>+${pedido.comisionTarjeta.toFixed(2)}</span>
              </div>
            ) : null}
            <div
              className="flex justify-between pt-1.5 font-semibold text-sm"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#F5F5F5' }}
            >
              <span>Total</span>
              <span style={{ color: '#C0392B' }}>${pedido.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9CA3AF' }}>
            <Phone size={12} style={{ color: '#C0392B' }} />
            {pedido.cliente.telefono}
          </div>

          {/* Notas */}
          {pedido.notas && (
            <p
              className="text-xs rounded-lg p-2.5"
              style={{ backgroundColor: 'rgba(251,176,64,0.08)', color: '#FBB040', border: '1px solid rgba(251,176,64,0.15)' }}
            >
              📝 {pedido.notas}
            </p>
          )}

          {/* Cambio de estado */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'rgba(156,163,175,0.6)' }}>Cambiar estado:</p>
            <div className="flex flex-wrap gap-1.5">
              {actualizando ? (
                <Loader2 size={16} className="animate-spin" style={{ color: '#9CA3AF' }} />
              ) : (
                ESTADOS.filter((e) => e.valor !== pedido.estado).map((e) => (
                  <button
                    key={e.valor}
                    onClick={() => cambiarEstado(e.valor)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80 active:scale-95"
                    style={{
                      backgroundColor: e.bg,
                      color: e.color,
                      border: `1px solid ${e.color}30`,
                    }}
                  >
                    {e.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
