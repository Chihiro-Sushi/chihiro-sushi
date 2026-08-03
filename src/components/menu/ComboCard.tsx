'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { useCarrito } from '@/context/CarritoContext'
import { useToast } from '@/context/ToastContext'
import type { MenuItem } from '@/types'

interface GrupoCombo {
  etiqueta: string
  opciones: string[]
}

interface ComboConfig {
  incluye: string[]
  grupos: GrupoCombo[]
}

function expandirBebidas(bebidas: MenuItem[]): string[] {
  const opciones: string[] = []
  for (const b of bebidas) {
    if (b.variantes && b.variantes.length > 0) {
      const calificador = b.nombre.trim().split(' ').pop()
      for (const v of b.variantes) {
        opciones.push(calificador ? `${v.nombre} ${calificador}` : `${v.nombre} (${b.nombre})`)
      }
    } else {
      opciones.push(b.nombre)
    }
  }
  return opciones
}

function configPorCombo(nombre: string, bebidas: string[]): ComboConfig | null {
  const ROLLOS_COMBO_2 = ['Ebi Furai Roll', 'Manchego Especial', 'Empanizado Roll']
  const ROLLOS_COMBO_3 = ['Mango Roll', 'Crispy Tuna Roll', 'California Roll']
  const PROTEINAS = ['Pollo', 'Sirloin', 'Camarón']

  switch (nombre) {
    case 'Combo 1':
      return {
        incluye: ['Yakimeshi con pollo empanizado y tampico'],
        grupos: [{ etiqueta: 'Bebida', opciones: bebidas }],
      }
    case 'Combo 2':
      return {
        incluye: ['1/2 orden de yakimeshi vegetariano'],
        grupos: [
          { etiqueta: 'Rollo', opciones: ROLLOS_COMBO_2 },
          { etiqueta: 'Bebida', opciones: bebidas },
        ],
      }
    case 'Combo 3':
      return {
        incluye: ['2 Kushiages de manchego'],
        grupos: [
          { etiqueta: 'Rollo', opciones: ROLLOS_COMBO_3 },
          { etiqueta: 'Bebida', opciones: bebidas },
        ],
      }
    case 'Combo Pareja':
      return {
        incluye: ['2 Kushiages de manchego', '1 Chicken Roll'],
        grupos: [
          { etiqueta: 'Proteína del Yakimeshi', opciones: PROTEINAS },
          { etiqueta: 'Bebida 1', opciones: bebidas },
          { etiqueta: 'Bebida 2', opciones: bebidas },
        ],
      }
    default:
      return null
  }
}

export default function ComboCard({ item, bebidas }: { item: MenuItem; bebidas: MenuItem[] }) {
  const { agregar } = useCarrito()
  const { mostrarToast } = useToast()
  const config = configPorCombo(item.nombre, expandirBebidas(bebidas))
  const [seleccion, setSeleccion] = useState<Record<string, string>>({})
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  if (!config) return null

  const listo = config.grupos.every((g) => seleccion[g.etiqueta])

  function elegir(etiqueta: string, opcion: string) {
    setSeleccion((prev) => ({ ...prev, [etiqueta]: opcion }))
  }

  function handleAgregar() {
    if (!listo || !config) return
    const variante = config.grupos.map((g) => `${g.etiqueta}: ${seleccion[g.etiqueta]}`).join(' · ')
    agregar(item, variante, cantidad)
    const label = cantidad > 1 ? `${cantidad}× ${item.nombre}` : item.nombre
    mostrarToast(`${label} agregado al carrito`)
    setSeleccion({})
    setCantidad(1)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  const noDisponible = !item.disponible

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#141414', border: '1px solid rgba(192,57,43,0.2)' }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="font-bold text-base" style={{ color: '#F5F5F5' }}>
              🎁 {item.nombre}
            </h3>
            {item.descripcion && (
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#9CA3AF' }}>
                {item.descripcion}
              </p>
            )}
          </div>
          <span className="font-bold text-lg shrink-0" style={{ color: '#C0392B' }}>
            ${item.precio}
          </span>
        </div>

        {noDisponible ? (
          <button
            disabled
            className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(156,163,175,0.4)' }}
          >
            No disponible
          </button>
        ) : (
          <>
            {config.incluye.length > 0 && (
              <ul className="mt-3 space-y-1">
                {config.incluye.map((linea) => (
                  <li key={linea} className="text-xs flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
                    <Check size={11} style={{ color: '#C0392B' }} /> {linea}
                  </li>
                ))}
              </ul>
            )}

            {config.grupos.map((grupo) => (
              <div key={grupo.etiqueta} className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#F5F5F5' }}>
                  {grupo.etiqueta}
                </p>
                <div className="flex flex-wrap gap-2">
                  {grupo.opciones.map((op) => {
                    const selec = seleccion[grupo.etiqueta] === op
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => elegir(grupo.etiqueta, op)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{
                          border: selec ? '1.5px solid #C0392B' : '1.5px solid rgba(255,255,255,0.1)',
                          backgroundColor: selec ? 'rgba(192,57,43,0.15)' : 'transparent',
                          color: selec ? '#C0392B' : '#9CA3AF',
                          cursor: 'pointer',
                        }}
                      >
                        {selec && <Check size={11} />}
                        {op}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {listo && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-medium transition-all hover:scale-110 active:scale-95"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
                >
                  −
                </button>
                <span className="text-blanco font-semibold text-sm w-6 text-center">{cantidad}</span>
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.min(20, c + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-medium transition-all hover:scale-110 active:scale-95"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleAgregar}
              disabled={!listo}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-95 hover:scale-[1.02] hover:shadow-lg hover:shadow-rojo/30"
              style={{
                backgroundColor: agregado ? '#16a34a' : listo ? '#C0392B' : 'rgba(255,255,255,0.05)',
                color: listo || agregado ? '#F5F5F5' : 'rgba(156,163,175,0.4)',
                cursor: listo ? 'pointer' : 'not-allowed',
              }}
            >
              {agregado ? (
                <><Check size={16} /> Agregado</>
              ) : (
                <><Plus size={16} /> {listo
                  ? (cantidad > 1 ? `Agregar × ${cantidad} — $${item.precio * cantidad}` : 'Agregar al carrito')
                  : 'Elige todas las opciones'
                }</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
