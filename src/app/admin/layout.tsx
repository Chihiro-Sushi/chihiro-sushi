'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'
import { LayoutDashboard, UtensilsCrossed, Tag, Settings, LogOut, Loader2 } from 'lucide-react'

const NAV = [
  { href: '/admin/dashboard', label: 'Pedidos', Icon: LayoutDashboard },
  { href: '/admin/dashboard/menu', label: 'Menú', Icon: UtensilsCrossed },
  { href: '/admin/dashboard/promociones', label: 'Promociones', Icon: Tag },
  { href: '/admin/dashboard/configuracion', label: 'Configuración', Icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [autenticado, setAutenticado] = useState<boolean | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user && pathname !== '/admin/login') {
        router.replace('/admin/login')
      } else {
        setAutenticado(!!user)
      }
    })
    return unsub
  }, [pathname, router])

  // El panel suele quedarse abierto horas en la cocina; si queda corriendo una
  // versión vieja del código, un deploy nuevo (ej. fixes de procesamiento de
  // pedidos) no tiene efecto hasta recargar. Recargamos solo al detectar un
  // deploy nuevo, para que siempre corra la versión actual.
  useEffect(() => {
    let versionInicial: string | null = null

    async function verificarVersion() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        const { version } = await res.json()
        if (versionInicial === null) {
          versionInicial = version
        } else if (version !== versionInicial) {
          window.location.reload()
        }
      } catch {
        // sin conexión momentánea, se reintenta en el próximo ciclo
      }
    }

    verificarVersion()
    const intervalo = setInterval(verificarVersion, 60000)
    return () => clearInterval(intervalo)
  }, [])

  if (pathname === '/admin/login') return <>{children}</>

  if (autenticado === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#C0392B' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r" style={{ backgroundColor: '#141414', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="font-black text-sm" style={{ color: '#F5F5F5' }}>
            <span style={{ color: '#C0392B' }}>CHIHIRO</span> ADMIN
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const activo = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: activo ? 'rgba(192,57,43,0.15)' : 'transparent',
                  color: activo ? '#C0392B' : '#9CA3AF',
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => signOut(auth).then(() => router.push('/admin/login'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:opacity-80"
            style={{ color: '#9CA3AF' }}
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
