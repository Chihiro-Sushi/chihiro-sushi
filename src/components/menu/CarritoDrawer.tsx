'use client'

import { useRouter } from 'next/navigation'
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCarrito } from '@/context/CarritoContext'
import { useConfiguracion } from '@/hooks/useConfiguracion'
import { calcularDescuentoPorItem } from '@/lib/promociones'

import type { Promocion } from '@/types'

interface Props {
  abierto: boolean
  onCerrar: () => void
}

function etiquetaDescuento(promociones: Promocion[]): string {
  const activas = promociones.filter((p) => p.activa)
  const tipos = [...new Set(activas.map((p) => p.tipo))]
  if (tipos.length === 0) return 'Promoción'
  if (tipos.length > 1) return 'Múltiples promociones'
  const tipo = tipos[0]
  if (tipo === '3x2') return 'Promo 3×2'
  if (tipo === '2x1') return 'Promo 2×1'
  const promo = activas.find((p) => p.tipo === tipo)
  if (tipo === 'porcentaje') return `${promo?.valor ?? ''}% OFF`
  if (tipo === 'fijo') return `-$${promo?.valor ?? ''} fijo`
  return 'Promoción'
}

export default function CarritoDrawer({ abierto, onCerrar }: Props) {
  const { items, total, descuento, totalConDescuento, promocionesActivas, agregar, quitar, eliminar, cantidad } = useCarrito()
  const router = useRouter()
  const config = useConfiguracion()

  const descuentosPorItem = calcularDescuentoPorItem(items, promocionesActivas)

  const hora = new Date().getHours()
  const servicioSuspendido = hora < 14 || config.suspensionDelivery

  function irACheckout() {
    onCerrar()
    router.push('/checkout')
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        className={`fixed inset-0 bg-negro/70 z-50 transition-opacity duration-300 ${
          abierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel lateral */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-carbon z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          abierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blanco/10">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-rojo" />
            <h2 className="text-blanco font-semibold">
              Tu pedido {cantidad > 0 && <span className="text-rojo">({cantidad})</span>}
            </h2>
          </div>
          <button onClick={onCerrar} className="text-gris hover:text-blanco transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <ShoppingBag size={48} className="text-gris/30" />
              <p className="text-gris">Tu carrito está vacío</p>
              <button onClick={onCerrar} className="text-rojo text-sm hover:underline">
                Ver el menú
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
              const clave = item.variante ? `${item.itemId}__${item.variante}` : item.itemId
              const promoItem = descuentosPorItem.get(clave)
              const descItem = promoItem?.descuento ?? 0
              const subtotalConDesc = Math.max(0, Math.round((item.subtotal - descItem) * 100) / 100)

              return (
                <div key={`${item.itemId}-${item.variante}-${idx}`}
                  className="flex items-start gap-3 bg-negro/50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-blanco text-sm font-medium leading-tight">{item.nombre}</p>
                    {item.variante && (
                      <p className="text-gris text-xs mt-0.5">{item.variante}</p>
                    )}
                    {descItem > 0 ? (
                      <>
                        <p className="text-sm line-through mt-1" style={{ color: '#C0392B', opacity: 0.4 }}>
                          ${item.subtotal.toFixed(2)}
                        </p>
                        <p className="text-rojo text-sm font-semibold leading-tight">
                          ${subtotalConDesc.toFixed(2)}
                        </p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#22C55E' }}>
                          🎉 {promoItem!.etiqueta}
                        </p>
                      </>
                    ) : (
                      <p className="text-rojo text-sm font-semibold mt-1">
                        ${item.subtotal.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => quitar(item.itemId, item.variante)}
                      className="w-7 h-7 rounded-full bg-blanco/10 flex items-center justify-center hover:bg-rojo/20 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-blanco text-sm w-4 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => {
                        const fakeItem = { id: item.itemId, nombre: item.nombre, precio: item.precioUnitario, variantes: [], disponible: true, orden: 0, categoriaId: item.categoriaId ?? '', descripcion: '' }
                        agregar(fakeItem as any, item.variante)
                      }}
                      className="w-7 h-7 rounded-full bg-blanco/10 flex items-center justify-center hover:bg-rojo/20 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => eliminar(item.itemId, item.variante)}
                      className="w-7 h-7 rounded-full bg-blanco/10 flex items-center justify-center hover:bg-rojo/20 transition-colors ml-1"
                    >
                      <Trash2 size={12} className="text-rojo" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-blanco/10 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-gris pt-0.5">Subtotal</span>
              <div className="text-right">
                {descuento > 0 ? (
                  <>
                    <p className="text-sm line-through" style={{ color: '#9CA3AF', opacity: 0.45 }}>
                      ${total.toFixed(2)}
                    </p>
                    <p className="text-lg font-bold leading-tight" style={{ color: '#F5F5F5' }}>
                      ${totalConDescuento.toFixed(2)}
                    </p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: '#22C55E' }}>
                      Ahorraste ${descuento.toFixed(2)} · {etiquetaDescuento(promocionesActivas)}
                    </p>
                  </>
                ) : (
                  <span className="text-sm text-blanco">${total.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gris/60">
              <span>Envío</span>
              <span>Se calcula al confirmar dirección</span>
            </div>
            {servicioSuspendido && (
              <div className="rounded-xl px-4 py-3 text-xs text-center"
                style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#F87171' }}>
                {config.suspensionDelivery
                  ? 'Los pedidos no están disponibles por el momento'
                  : 'Servicio disponible a partir de las 2:00 pm'}
              </div>
            )}
            <button
              onClick={irACheckout}
              disabled={servicioSuspendido}
              className="w-full bg-rojo text-blanco font-semibold py-3 rounded-xl transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hacer pedido — ${totalConDescuento.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
