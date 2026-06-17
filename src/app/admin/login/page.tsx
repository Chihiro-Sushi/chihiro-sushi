'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/admin/dashboard')
    } catch {
      setError('Email o contraseña incorrectos.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black" style={{ color: '#F5F5F5' }}>
            <span style={{ color: '#C0392B' }}>CHIHIRO</span> SUSHI
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Panel de administración</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none"
              style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none"
              style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl p-3"
              style={{ backgroundColor: 'rgba(192,57,43,0.1)', color: '#F87171' }}>
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
          >
            {cargando ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
