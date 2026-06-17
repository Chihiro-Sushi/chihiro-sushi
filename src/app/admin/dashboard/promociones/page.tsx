'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Promocion } from '@/types'
import { Plus, Edit2, Trash2, Loader2, X, Check, Tag } from 'lucide-react'

const PROMO_VACIA: Omit<Promocion, 'id'> = {
  nombre: '',
  descripcion: '',
  tipo: '3x2',
  valor: 0,
  activa: true,
}

export default function PromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState<Omit<Promocion, 'id'>>(PROMO_VACIA)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'promociones'), orderBy('nombre')),
      (snap) => { setPromociones(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promocion))); setCargando(false) }
    )
    return unsub
  }, [])

  function editar(p: Promocion) {
    setForm({ nombre: p.nombre, descripcion: p.descripcion, tipo: p.tipo, valor: p.valor, activa: p.activa })
    setEditandoId(p.id)
    setMostrarForm(true)
  }

  function reset() { setForm(PROMO_VACIA); setEditandoId(null); setMostrarForm(false) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      if (editandoId) { await updateDoc(doc(db, 'promociones', editandoId), { ...form }) }
      else { await addDoc(collection(db, 'promociones'), form) }
      reset()
    } finally { setGuardando(false) }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta promoción?')) return
    await deleteDoc(doc(db, 'promociones', id))
  }

  async function toggleActiva(p: Promocion) {
    await updateDoc(doc(db, 'promociones', p.id), { activa: !p.activa })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Promociones</h1>
        <button onClick={() => { setMostrarForm(true); setForm(PROMO_VACIA); setEditandoId(null) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}>
          <Plus size={16} /> Nueva promoción
        </button>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between items-center">
              <h2 className="font-bold" style={{ color: '#F5F5F5' }}>
                {editandoId ? 'Editar promoción' : 'Nueva promoción'}
              </h2>
              <button onClick={reset}><X size={20} style={{ color: '#9CA3AF' }} /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Nombre</span>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Descripción</span>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                  style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Tipo</span>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Promocion['tipo'] })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }}>
                  <option value="3x2">3×2</option>
                  <option value="porcentaje">Descuento %</option>
                  <option value="fijo">Descuento fijo ($)</option>
                </select>
              </label>
              {form.tipo !== '3x2' && (
                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                    Valor ({form.tipo === 'porcentaje' ? '%' : '$'})
                  </span>
                  <input type="number" min={0} value={form.valor} onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }} />
                </label>
              )}
              <label className="flex items-center gap-2 text-sm" style={{ color: '#9CA3AF' }}>
                <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} className="accent-red-600" />
                Activa
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={reset} className="flex-1 py-2.5 rounded-xl text-sm border"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}>Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}>
                  {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin" style={{ color: '#C0392B' }} /></div>
      ) : promociones.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Tag size={40} style={{ color: 'rgba(156,163,175,0.3)' }} />
          <p style={{ color: '#9CA3AF' }}>No hay promociones creadas</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {promociones.map((p) => (
            <div key={p.id} className="rounded-xl p-4 flex items-start justify-between gap-3"
              style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.05)', opacity: p.activa ? 1 : 0.5 }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#F5F5F5' }}>{p.nombre}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{p.descripcion}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                    {p.tipo === '3x2' ? '3×2' : p.tipo === 'porcentaje' ? `${p.valor}% OFF` : `-$${p.valor}`}
                  </span>
                  <button onClick={() => toggleActiva(p)} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: p.activa ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.1)', color: p.activa ? '#22C55E' : '#9CA3AF' }}>
                    {p.activa ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => editar(p)} className="p-1.5 rounded-lg hover:opacity-80"><Edit2 size={14} style={{ color: '#9CA3AF' }} /></button>
                <button onClick={() => eliminar(p.id)} className="p-1.5 rounded-lg hover:opacity-80"><Trash2 size={14} style={{ color: '#C0392B' }} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
