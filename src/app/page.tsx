'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ChevronDown, AlertCircle, Tag } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CategoriaNav from '@/components/menu/CategoriaNav'
import ItemCard from '@/components/menu/ItemCard'
import ArmaRolloCard from '@/components/menu/ArmaRolloCard'
import { useMenu } from '@/hooks/useMenu'
import { useCarrito } from '@/context/CarritoContext'
import { useConfiguracion } from '@/hooks/useConfiguracion'
import type { Categoria, Promocion, MenuItem } from '@/types'

const HERO_IMAGES = [
  '/images/04032026-_DSC4775.jpg',
  '/images/31012026-_DSC2581.jpg',
  '/images/01022026-_DSC2652.jpg',
]

const PROMO_CAT: Categoria = {
  id: '__promociones',
  nombre: 'Promociones',
  orden: -1,
  activa: true,
  icono: '🎉',
}

const EXTRAS_CAT: Categoria = {
  id: '__extras',
  nombre: 'Extras',
  orden: -0.5,
  activa: true,
  icono: '🥑',
}

const EXTRAS_ITEMS: MenuItem[] = [
  {
    id: '__extra_aguacate',
    categoriaId: '__extras',
    nombre: 'Aguacate',
    descripcion: 'Aguacate fresco para añadir a tu rollo',
    precio: 25,
    disponible: true,
    orden: 1,
  },
  {
    id: '__extra_tampico',
    categoriaId: '__extras',
    nombre: 'Tampico',
    descripcion: 'Tampico para añadir a tu rollo',
    precio: 25,
    disponible: true,
    orden: 2,
  },
  {
    id: '__extra_philadelphia',
    categoriaId: '__extras',
    nombre: 'Philadelphia',
    descripcion: 'Queso Philadelphia para añadir a tu rollo',
    precio: 25,
    disponible: true,
    orden: 3,
  },
]

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function esHoyValida(promo: Promocion): boolean {
  if (!promo.diasSemana || promo.diasSemana.length === 0) return true
  return promo.diasSemana.includes(new Date().getDay())
}

function badgeTipo(promo: Promocion): string {
  if (promo.tipo === '3x2') return '3×2'
  if (promo.tipo === 'porcentaje') return `${promo.valor}% OFF`
  return `-$${promo.valor}`
}

export default function HomePage() {
  const { categorias, itemsPorCategoria, cargando, error } = useMenu()
  const { promocionesActivas } = useCarrito()
  const config = useConfiguracion()
  const [categoriaActiva, setCategoriaActiva] = useState<string>('')
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const promosDelDia = promocionesActivas.filter(esHoyValida)
  const mostrarPromos = promosDelDia.length > 0
  const categoriasNav: Categoria[] = [
    ...(mostrarPromos ? [PROMO_CAT] : []),
    ...categorias,
    EXTRAS_CAT,
  ]

  function scrollACategoria(id: string) {
    setCategoriaActiva(id)
    catRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!categoriaActiva && categoriasNav.length > 0) {
    setCategoriaActiva(categoriasNav[0].id)
  }

  function alcanceTexto(promo: Promocion): string {
    if (promo.categoriaIds && promo.categoriaIds.length > 0) {
      return promo.categoriaIds
        .map((id) => categorias.find((c) => c.id === id)?.nombre || id)
        .join(', ')
    }
    if (promo.itemIds && promo.itemIds.length > 0) {
      return `${promo.itemIds.length} producto${promo.itemIds.length > 1 ? 's' : ''} seleccionado${promo.itemIds.length > 1 ? 's' : ''}`
    }
    return 'Todos los productos'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: '90vh', minHeight: 500 }}>
        <Image
          src={HERO_IMAGES[0]}
          alt="Chihiro Sushi"
          fill
          className="object-cover"
          style={{ filter: 'brightness(0.4)' }}
          priority
        />
        <div className="relative z-10 text-center px-4 fade-up">
          <h1 className="font-black tracking-tight mb-4" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
            <span style={{ color: '#C0392B' }}>CHIHIRO</span>{' '}
            <span style={{ color: '#F5F5F5' }}>SUSHI</span>
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '1.125rem', marginBottom: 8 }}>
            {config.slogan}
          </p>
          <p style={{ color: '#9CA3AF', opacity: 0.6, fontSize: '0.875rem', marginBottom: 32 }}>
            Cocina Japonesa Fusión · Delivery a todo Playa del Carmen
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full mb-8 bounce-soft"
            style={{ backgroundColor: 'rgba(192,57,43,0.9)', color: '#F5F5F5', boxShadow: '0 8px 24px rgba(192,57,43,0.3)' }}>
            {config.textoDestacado}
          </div>
          <div className="flex flex-col items-center">
            <a href="#menu" style={{ color: '#9CA3AF' }}>
              <ChevronDown size={32} className="animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {config.suspensionDelivery && (
        <div className="w-full py-10 px-4 text-center"
          style={{
            background: 'linear-gradient(135deg, #7B0000 0%, #C0392B 50%, #7B0000 100%)',
            borderBottom: '2px solid rgba(255,255,255,0.08)',
          }}>
          <div className="max-w-lg mx-auto">
            <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.75rem' }}>🌧️</div>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#F5F5F5', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Delivery suspendido temporalmente
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,245,0.85)' }}>
              Por condiciones climáticas u otros motivos, no podemos procesar pedidos en este momento.
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: 'rgba(245,245,245,0.75)' }}>
              ¡Gracias por tu comprensión — vuelve pronto! 🙏
            </p>
          </div>
        </div>
      )}

      {/* Galería */}
      <section id="nosotros" className="py-12" style={{ backgroundColor: '#141414' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-3">
            {HERO_IMAGES.map((src, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>
                <Image src={src} alt="Chihiro Sushi" fill className="object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm max-w-md mx-auto" style={{ color: '#9CA3AF' }}>
            En nuestra cocina nos tomamos muy en serio la seguridad alimentaria.
            Si tienes alguna alergia, infórmanos antes de realizar tu pedido.
          </p>
        </div>
      </section>

      {/* Menú */}
      <section id="menu" className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-1" style={{ color: '#F5F5F5' }}>
            Nuestro <span style={{ color: '#C0392B' }}>Menú</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
            Solo disponible en delivery · {config.horario}{config.tiempoEntrega ? ` · Entrega en ${config.tiempoEntrega}` : ''}
          </p>

          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C0392B', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Cargando menú...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <AlertCircle size={40} style={{ color: '#C0392B', opacity: 0.6 }} />
              <p style={{ color: '#9CA3AF' }}>No se pudo cargar el menú. Verifica tu conexión.</p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <AlertCircle size={40} style={{ color: '#9CA3AF', opacity: 0.4 }} />
              <p style={{ color: '#9CA3AF' }}>El menú no está disponible en este momento.</p>
            </div>
          ) : (
            <>
              <div className="sticky top-16 z-30 backdrop-blur py-3 -mx-4 px-4 mb-6"
                style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <CategoriaNav
                  categorias={categoriasNav}
                  activa={categoriaActiva}
                  onSeleccionar={scrollACategoria}
                />
              </div>

              <div className="space-y-12">

                {/* ─── Sección Promociones ─── */}
                {mostrarPromos && (
                  <div
                    ref={(el) => { catRefs.current['__promociones'] = el }}
                    className="scroll-mt-36"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-2xl">🎉</span>
                      <h3 className="text-xl font-bold" style={{ color: '#F5F5F5' }}>Promociones</h3>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(192,57,43,0.2)' }} />
                      <span className="text-xs" style={{ color: 'rgba(156,163,175,0.5)' }}>
                        {promosDelDia.length} activa{promosDelDia.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {promosDelDia.map((promo) => (
                        <div
                          key={promo.id}
                          className="rounded-2xl p-5"
                          style={{
                            background: 'linear-gradient(135deg, rgba(192,57,43,0.12) 0%, rgba(192,57,43,0.04) 100%)',
                            border: '1px solid rgba(192,57,43,0.25)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h4 className="font-bold text-base leading-tight" style={{ color: '#F5F5F5' }}>
                              {promo.nombre}
                            </h4>
                            <span
                              className="shrink-0 text-sm font-black px-3 py-1 rounded-full"
                              style={{ backgroundColor: 'rgba(192,57,43,0.25)', color: '#E74C3C' }}
                            >
                              {badgeTipo(promo)}
                            </span>
                          </div>

                          {promo.descripcion && (
                            <p className="text-sm mb-3 leading-relaxed" style={{ color: '#9CA3AF' }}>
                              {promo.descripcion}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>
                              <Tag size={10} />
                              {alcanceTexto(promo)}
                            </span>
                            {promo.diasSemana && promo.diasSemana.length > 0 && (
                              <span className="text-xs px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>
                                📅 {promo.diasSemana.map((d) => DIAS_CORTO[d]).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Categorías del menú ─── */}
                {categorias.map((cat) => {
                  const items = itemsPorCategoria(cat.id)
                  if (items.length === 0) return null
                  return (
                    <div key={cat.id} ref={(el) => { catRefs.current[cat.id] = el }} className="scroll-mt-36">
                      <div className="flex items-center gap-3 mb-3">
                        {cat.icono && <span className="text-2xl">{cat.icono}</span>}
                        <h3 className="text-xl font-bold" style={{ color: '#F5F5F5' }}>{cat.nombre}</h3>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(192,57,43,0.2)' }} />
                        <span className="text-xs" style={{ color: 'rgba(156,163,175,0.5)' }}>{items.length} opciones</span>
                      </div>
                      {(cat.id === 'rollos_frios' || cat.id === 'rollos_calientes') && (
                        <div className="flex items-center gap-3 mb-5">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.25)' }}>
                            10 piezas por rollo
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(156,163,175,0.5)' }}>
                            PD: Por Dentro · PF: Por Fuera
                          </span>
                        </div>
                      )}
                      <div className={cat.id === 'arma_tu_rollo' ? '' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
                        {items.map((item) =>
                          cat.id === 'arma_tu_rollo'
                            ? <ArmaRolloCard key={item.id} item={item} />
                            : <ItemCard key={item.id} item={item} />
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* ─── Extras ─── */}
                <div
                  ref={(el) => { catRefs.current['__extras'] = el }}
                  className="scroll-mt-36"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🥑</span>
                    <h3 className="text-xl font-bold" style={{ color: '#F5F5F5' }}>Extras</h3>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(192,57,43,0.2)' }} />
                    <span className="text-xs" style={{ color: 'rgba(156,163,175,0.5)' }}>3 opciones</span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
                    Ingredientes adicionales para complementar tu pedido · $25 c/u
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {EXTRAS_ITEMS.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Fotos adicionales */}
      <section className="py-10" style={{ backgroundColor: '#141414' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              '/images/31012026-_DSC2438.jpg',
              '/images/01022026-_DSC2616.jpg',
              '/images/01022026-_DSC2637.jpg',
              '/images/04032026-_DSC4809.jpg',
            ].map((src, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>
                <Image src={src} alt="Chihiro Sushi" fill className="object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer config={config} />
    </div>
  )
}
