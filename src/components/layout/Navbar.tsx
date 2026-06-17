'use client'

import { ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCarrito } from '@/context/CarritoContext'
import CarritoDrawer from '@/components/menu/CarritoDrawer'

export default function Navbar() {
  const { cantidad } = useCarrito()
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [progreso, setProgreso] = useState(0)

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setProgreso(total > 0 ? (window.scrollY / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-negro/95 backdrop-blur border-b border-rojo/30">
        {/* Barra de progreso de scroll */}
        <div
          className="absolute bottom-0 left-0 h-[2px] transition-all duration-150 ease-out"
          style={{ width: `${progreso}%`, background: 'linear-gradient(to right, #C0392B, #e74c3c)' }}
        />
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-2xl font-bold text-rojo tracking-tight transition-all duration-200 hover:scale-105 hover:opacity-90 inline-block"
            >
              CHIHIRO <span className="text-blanco">SUSHI</span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gris">
            <a href="#menu" className="hover:text-rojo transition-all duration-200 hover:scale-110 inline-block">Menú</a>
            <a href="#nosotros" className="hover:text-rojo transition-all duration-200 hover:scale-110 inline-block">Nosotros</a>
            <a href="#contacto" className="hover:text-rojo transition-all duration-200 hover:scale-110 inline-block">Contacto</a>
          </nav>

          <button
            onClick={() => setCarritoAbierto(true)}
            className="relative p-2 text-blanco hover:text-rojo transition-colors"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={24} />
            {cantidad > 0 && (
              <span className="absolute -top-1 -right-1 bg-rojo text-blanco text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cantidad > 99 ? '99+' : cantidad}
              </span>
            )}
          </button>
        </div>
      </header>

      <CarritoDrawer abierto={carritoAbierto} onCerrar={() => setCarritoAbierto(false)} />
    </>
  )
}
