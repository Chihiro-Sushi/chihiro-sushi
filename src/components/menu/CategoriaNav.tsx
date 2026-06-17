'use client'

import { useEffect, useRef } from 'react'
import type { Categoria } from '@/types'

interface Props {
  categorias: Categoria[]
  activa: string
  onSeleccionar: (id: string) => void
}

export default function CategoriaNav({ categorias, activa, onSeleccionar }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current?.querySelector(`[data-id="${activa}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activa])

  return (
    <div className="relative">
      {/* Fade izquierdo */}
      <div className="absolute inset-y-0 left-0 w-8 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.95), transparent)' }} />
      {/* Fade derecho */}
      <div className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(10,10,10,0.95), transparent)' }} />

      <div
        ref={ref}
        className="flex gap-2 overflow-x-auto py-2 px-3 snap-x"
      >
        {categorias.map((cat) => (
          <button
            key={cat.id}
            data-id={cat.id}
            onClick={() => onSeleccionar(cat.id)}
            className={`snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activa === cat.id
                ? 'bg-rojo text-blanco shadow-lg shadow-rojo/30 scale-105'
                : 'bg-carbon text-gris border border-blanco/10 hover:text-blanco hover:scale-110 hover:shadow-lg hover:shadow-rojo/20 hover:border-rojo/40 hover:z-10 relative'
            }`}
          >
            {cat.icono && <span className="mr-1">{cat.icono}</span>}
            {cat.nombre}
          </button>
        ))}
        {/* Espaciador para que el último tab no quede bajo el fade */}
        <div className="w-12 shrink-0" />
      </div>
    </div>
  )
}
