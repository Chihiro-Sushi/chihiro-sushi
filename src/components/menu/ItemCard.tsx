'use client'

import { useState } from 'react'
import { Plus, ChevronDown, Check } from 'lucide-react'
import { useCarrito } from '@/context/CarritoContext'
import { useToast } from '@/context/ToastContext'
import type { MenuItem } from '@/types'

interface Props {
  item: MenuItem
}

export default function ItemCard({ item }: Props) {
  const { agregar } = useCarrito()
  const { mostrarToast } = useToast()
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<string>('')
  const [mostrarVariantes, setMostrarVariantes] = useState(false)
  const [modoSelector, setModoSelector] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  const tieneVariantes = item.variantes && item.variantes.length > 0

  const precioMostrar =
    tieneVariantes && varianteSeleccionada
      ? item.precio + (item.variantes?.find((v) => v.nombre === varianteSeleccionada)?.precioExtra ?? 0)
      : item.precio

  function handleAgregar() {
    if (tieneVariantes && !varianteSeleccionada) {
      setMostrarVariantes(true)
      return
    }
    setModoSelector(true)
  }

  function handleConfirmar() {
    agregar(item, varianteSeleccionada || undefined, cantidad)
    const label = cantidad > 1 ? `${cantidad}× ${item.nombre}` : item.nombre
    mostrarToast(`${label} agregado al carrito`)
    setModoSelector(false)
    setCantidad(1)
    setVarianteSeleccionada('')
    setMostrarVariantes(false)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  const noDisponible = !item.disponible

  return (
    <div className={`bg-carbon border border-blanco/5 rounded-xl overflow-hidden transition-all duration-200 group relative flex flex-row md:flex-col h-full ${noDisponible ? 'opacity-55' : 'hover:border-rojo/40 hover:scale-[1.02] hover:shadow-xl hover:shadow-rojo/10 hover:z-10'}`}>
      {noDisponible && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>
            No disponible
          </span>
        </div>
      )}
      {item.imagenUrl && (
        <div className="w-28 md:w-full aspect-square overflow-hidden shrink-0">
          <img
            src={item.imagenUrl}
            alt={item.nombre}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0">
        <div className="flex-1">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-blanco font-semibold text-sm leading-tight group-hover:text-rojo transition-colors">
                {item.nombre}
              </h3>
              {item.descripcion && (
                <p className="text-gris text-xs mt-1 leading-relaxed whitespace-pre-line">
                  {item.descripcion}
                </p>
              )}
              {item.etiquetas && item.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.etiquetas.map((e) => (
                    <span key={e} className="text-xs bg-rojo/10 text-rojo px-2 py-0.5 rounded-full">
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-rojo font-bold text-base shrink-0">
              ${precioMostrar}
            </span>
          </div>

          {/* Selector de variantes */}
          {tieneVariantes && (
            <div className="mt-3">
              <button
                onClick={() => setMostrarVariantes(!mostrarVariantes)}
                className="flex items-center gap-1 text-xs text-gris hover:text-blanco transition-colors"
              >
                {varianteSeleccionada || 'Elige una opción'}
                <ChevronDown size={12} className={mostrarVariantes ? 'rotate-180' : ''} />
              </button>
              {mostrarVariantes && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {item.variantes!.map((v) => (
                    <button
                      key={v.nombre}
                      onClick={() => { setVarianteSeleccionada(v.nombre); setMostrarVariantes(false) }}
                      className={`text-xs px-2 py-1.5 rounded-lg border transition-all text-left hover:scale-105 ${
                        varianteSeleccionada === v.nombre
                          ? 'border-rojo bg-rojo/10 text-rojo'
                          : 'border-blanco/10 text-gris hover:border-rojo/50'
                      }`}
                    >
                      {v.nombre}
                      {v.precioExtra > 0 && (
                        <span className="text-rojo/70 ml-1">+${v.precioExtra}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selector de cantidad o botón agregar */}
        {noDisponible ? (
          <button
            disabled
            className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(156,163,175,0.4)' }}
          >
            No disponible
          </button>
        ) : modoSelector ? (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              className="w-8 h-8 rounded-lg border border-blanco/10 text-gris hover:border-rojo/50 hover:text-blanco transition-all flex items-center justify-center text-base font-medium shrink-0"
            >
              −
            </button>
            <span className="w-6 text-center text-blanco font-semibold text-sm shrink-0">
              {cantidad}
            </span>
            <button
              onClick={() => setCantidad((c) => Math.min(20, c + 1))}
              className="w-8 h-8 rounded-lg border border-blanco/10 text-gris hover:border-rojo/50 hover:text-blanco transition-all flex items-center justify-center text-base font-medium shrink-0"
            >
              +
            </button>
            <button
              onClick={handleConfirmar}
              className="flex-1 flex items-center justify-center gap-1.5 bg-rojo hover:bg-rojo/80 text-blanco text-sm font-medium py-2 rounded-lg transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-rojo/30"
            >
              <Check size={14} />
              {cantidad > 1 ? `Agregar × ${cantidad}` : 'Agregar'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleAgregar}
            disabled={agregado}
            className="mt-3 w-full flex items-center justify-center gap-2 text-blanco text-sm font-medium py-2 rounded-lg transition-all duration-200 active:scale-95 hover:scale-[1.02] hover:shadow-lg"
            style={{
              backgroundColor: agregado ? '#16a34a' : '#C0392B',
              boxShadow: agregado ? '0 4px 12px rgba(22,163,74,0.3)' : undefined,
            }}
          >
            {agregado ? <><Check size={16} /> Agregado</> : <><Plus size={16} /> Agregar</>}
          </button>
        )}
      </div>
    </div>
  )
}
