'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { useCarrito } from '@/context/CarritoContext'
import { useToast } from '@/context/ToastContext'
import type { MenuItem } from '@/types'

const COMPLEMENTOS = [
  'Aguacate', 'Pepino', 'Manchego', 'Poro', 'Philadelphia',
  'Mango', 'Plátano frito', 'Zanahoria', 'Calabaza', 'Champiñón',
  'Tofu', 'Pimiento verde', 'Empanizado',
]

const PROTEINAS = [
  'Salmón', 'Atún', 'Pollo', 'Res', 'Surimi', 'Camarón', 'Pulpo', 'Kanikama',
]

const MAX_COMPLEMENTOS = 3
const MAX_PROTEINAS = 2

export default function ArmaRolloCard({ item }: { item: MenuItem }) {
  const { agregar } = useCarrito()
  const { mostrarToast } = useToast()
  const [complementos, setComplementos] = useState<string[]>([])
  const [proteinas, setProteinas] = useState<string[]>([])
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  function toggleComplemento(nombre: string) {
    setComplementos((prev) =>
      prev.includes(nombre)
        ? prev.filter((c) => c !== nombre)
        : prev.length < MAX_COMPLEMENTOS
        ? [...prev, nombre]
        : prev
    )
  }

  function toggleProteina(nombre: string) {
    setProteinas((prev) =>
      prev.includes(nombre)
        ? prev.filter((p) => p !== nombre)
        : prev.length < MAX_PROTEINAS
        ? [...prev, nombre]
        : prev
    )
  }

  const listo = complementos.length === MAX_COMPLEMENTOS && proteinas.length === MAX_PROTEINAS

  function handleAgregar() {
    if (!listo) return
    const variante = `${proteinas.join(', ')} · ${complementos.join(', ')}`
    agregar(item, variante, cantidad)
    const label = cantidad > 1 ? `${cantidad}× Arma Tu Rollo` : 'Arma Tu Rollo'
    mostrarToast(`${label} agregado al carrito`)
    setComplementos([])
    setProteinas([])
    setCantidad(1)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#141414', border: '1px solid rgba(192,57,43,0.2)' }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="font-bold text-base" style={{ color: '#F5F5F5' }}>
              🎨 Arma Tu Rollo
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Personaliza tu rollo — 10 piezas
            </p>
          </div>
          <span className="font-bold text-lg shrink-0" style={{ color: '#C0392B' }}>
            ${item.precio}
          </span>
        </div>

        {/* Proteínas */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F5F5F5' }}>
              Proteínas
            </p>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: proteinas.length === MAX_PROTEINAS ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.05)',
                color: proteinas.length === MAX_PROTEINAS ? '#C0392B' : '#9CA3AF',
              }}>
              {proteinas.length}/{MAX_PROTEINAS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROTEINAS.map((p) => {
              const selec = proteinas.includes(p)
              const bloqueado = !selec && proteinas.length >= MAX_PROTEINAS
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleProteina(p)}
                  disabled={bloqueado}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    border: selec ? '1.5px solid #C0392B' : '1.5px solid rgba(255,255,255,0.1)',
                    backgroundColor: selec ? 'rgba(192,57,43,0.15)' : 'transparent',
                    color: selec ? '#C0392B' : bloqueado ? 'rgba(156,163,175,0.3)' : '#9CA3AF',
                    cursor: bloqueado ? 'not-allowed' : 'pointer',
                  }}
                >
                  {selec && <Check size={11} />}
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        {/* Complementos */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F5F5F5' }}>
              Complementos
            </p>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: complementos.length === MAX_COMPLEMENTOS ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.05)',
                color: complementos.length === MAX_COMPLEMENTOS ? '#C0392B' : '#9CA3AF',
              }}>
              {complementos.length}/{MAX_COMPLEMENTOS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMPLEMENTOS.map((c) => {
              const selec = complementos.includes(c)
              const bloqueado = !selec && complementos.length >= MAX_COMPLEMENTOS
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleComplemento(c)}
                  disabled={bloqueado}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    border: selec ? '1.5px solid #C0392B' : '1.5px solid rgba(255,255,255,0.1)',
                    backgroundColor: selec ? 'rgba(192,57,43,0.15)' : 'transparent',
                    color: selec ? '#C0392B' : bloqueado ? 'rgba(156,163,175,0.3)' : '#9CA3AF',
                    cursor: bloqueado ? 'not-allowed' : 'pointer',
                  }}
                >
                  {selec && <Check size={11} />}
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        {/* Resumen selección */}
        {(proteinas.length > 0 || complementos.length > 0) && (
          <div className="mt-4 rounded-lg px-3 py-2.5 text-xs space-y-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {proteinas.length > 0 && (
              <p style={{ color: '#9CA3AF' }}>
                <span style={{ color: '#F5F5F5' }}>Proteínas:</span> {proteinas.join(', ')}
              </p>
            )}
            {complementos.length > 0 && (
              <p style={{ color: '#9CA3AF' }}>
                <span style={{ color: '#F5F5F5' }}>Complementos:</span> {complementos.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Selector de cantidad — solo visible cuando el rollo está listo */}
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

        {/* Botón */}
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
              ? (cantidad > 1 ? `Agregar × ${cantidad}` : 'Agregar al carrito')
              : `Elige ${MAX_PROTEINAS - proteinas.length > 0 ? `${MAX_PROTEINAS - proteinas.length} proteína${MAX_PROTEINAS - proteinas.length > 1 ? 's' : ''}` : `${MAX_COMPLEMENTOS - complementos.length} complemento${MAX_COMPLEMENTOS - complementos.length > 1 ? 's' : ''}`} más`
            }</>
          )}
        </button>
      </div>
    </div>
  )
}
