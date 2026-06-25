'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Promocion, Categoria, MenuItem } from '@/types'
import { Plus, Edit2, Trash2, Loader2, X, Check, Tag } from 'lucide-react'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface FormPromo {
  nombre: string
  descripcion: string
  tipo: Promocion['tipo']
  valor: number
  activa: boolean
  alcance: 'todos' | 'categorias' | 'productos'
  categoriaIds: string[]
  itemIds: string[]
  todosLosDias: boolean
  diasSemana: number[]
}

const FORM_VACIO: FormPromo = {
  nombre: '',
  descripcion: '',
  tipo: '3x2',
  valor: 0,
  activa: true,
  alcance: 'todos',
  categoriaIds: [],
  itemIds: [],
  todosLosDias: true,
  diasSemana: [],
}

function promoAForm(p: Promocion): FormPromo {
  const alcance =
    p.itemIds && p.itemIds.length > 0 ? 'productos'
    : p.categoriaIds && p.categoriaIds.length > 0 ? 'categorias'
    : 'todos'
  return {
    nombre: p.nombre,
    descripcion: p.descripcion,
    tipo: p.tipo,
    valor: p.valor ?? 0,
    activa: p.activa,
    alcance,
    categoriaIds: p.categoriaIds ?? [],
    itemIds: p.itemIds ?? [],
    todosLosDias: !p.diasSemana || p.diasSemana.length === 0,
    diasSemana: p.diasSemana ?? [],
  }
}

function formADatos(f: FormPromo): Omit<Promocion, 'id'> {
  return {
    nombre: f.nombre,
    descripcion: f.descripcion,
    tipo: f.tipo,
    valor: f.valor,
    activa: f.activa,
    categoriaIds: f.alcance === 'categorias' ? f.categoriaIds : [],
    itemIds: f.alcance === 'productos' ? f.itemIds : [],
    diasSemana: f.todosLosDias ? [] : f.diasSemana,
  }
}

const INPUT_STYLE = {
  backgroundColor: '#0A0A0A',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#F5F5F5',
}

export default function PromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [cargando, setCargando] = useState(true)
  const [menuCategorias, setMenuCategorias] = useState<Categoria[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [form, setForm] = useState<FormPromo>(FORM_VACIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'promociones'), orderBy('nombre')),
      (snap) => {
        setPromociones(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promocion)))
        setCargando(false)
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    getDocs(query(collection(db, 'menu_categorias'), orderBy('orden')))
      .then((snap) => setMenuCategorias(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Categoria))))
    getDocs(query(collection(db, 'menu_items'), orderBy('nombre')))
      .then((snap) => setMenuItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem))))
  }, [])

  function editar(p: Promocion) {
    setForm(promoAForm(p))
    setEditandoId(p.id)
    setMostrarForm(true)
  }

  function reset() {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setMostrarForm(false)
    setErrorMsg(null)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorMsg(null)
    try {
      const datos = formADatos(form)
      if (editandoId) {
        await updateDoc(doc(db, 'promociones', editandoId), { ...datos })
      } else {
        await addDoc(collection(db, 'promociones'), datos)
      }
      reset()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setErrorMsg(msg)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta promoción?')) return
    await deleteDoc(doc(db, 'promociones', id))
  }

  async function toggleActiva(p: Promocion) {
    await updateDoc(doc(db, 'promociones', p.id), { activa: !p.activa })
  }

  function toggleDia(d: number) {
    setForm((f) => {
      const dias = f.diasSemana.includes(d)
        ? f.diasSemana.filter((x) => x !== d)
        : [...f.diasSemana, d]
      return { ...f, diasSemana: dias }
    })
  }

  function toggleCategoria(id: string) {
    setForm((f) => {
      const ids = f.categoriaIds.includes(id)
        ? f.categoriaIds.filter((x) => x !== id)
        : [...f.categoriaIds, id]
      return { ...f, categoriaIds: ids }
    })
  }

  function toggleItem(id: string) {
    setForm((f) => {
      const ids = f.itemIds.includes(id)
        ? f.itemIds.filter((x) => x !== id)
        : [...f.itemIds, id]
      return { ...f, itemIds: ids }
    })
  }

  function resumenAlcance(p: Promocion): string {
    if (p.itemIds && p.itemIds.length > 0) return `${p.itemIds.length} producto(s)`
    if (p.categoriaIds && p.categoriaIds.length > 0) {
      return p.categoriaIds
        .map((id) => menuCategorias.find((c) => c.id === id)?.nombre || id)
        .join(', ')
    }
    return 'Todos los productos'
  }

  function resumenDias(p: Promocion): string {
    if (!p.diasSemana || p.diasSemana.length === 0) return 'Todos los días'
    return p.diasSemana.map((d) => DIAS_CORTO[d]).join(', ')
  }

  const itemsPorCategoria = menuCategorias
    .map((cat) => ({ cat, items: menuItems.filter((i) => i.categoriaId === cat.id) }))
    .filter((g) => g.items.length > 0)

  const alcanceTab = (valor: FormPromo['alcance']) => (
    <button
      key={valor}
      type="button"
      onClick={() => setForm({ ...form, alcance: valor })}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        backgroundColor: form.alcance === valor ? 'rgba(192,57,43,0.2)' : 'rgba(255,255,255,0.05)',
        color: form.alcance === valor ? '#C0392B' : '#9CA3AF',
        border: `1px solid ${form.alcance === valor ? 'rgba(192,57,43,0.4)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      {valor === 'todos' ? 'Todos los productos' : valor === 'categorias' ? 'Por categoría' : 'Por producto'}
    </button>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Promociones</h1>
        <button
          onClick={() => { setMostrarForm(true); setForm(FORM_VACIO); setEditandoId(null) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
        >
          <Plus size={16} /> Nueva promoción
        </button>
      </div>

      {/* Modal de formulario */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <form
            onSubmit={guardar}
            className="w-full max-w-lg rounded-2xl flex flex-col"
            style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 shrink-0">
              <h2 className="font-bold" style={{ color: '#F5F5F5' }}>
                {editandoId ? 'Editar promoción' : 'Nueva promoción'}
              </h2>
              <button type="button" onClick={reset}><X size={20} style={{ color: '#9CA3AF' }} /></button>
            </div>

            {/* Contenido scrollable */}
            <div className="overflow-y-auto px-6 pb-2 space-y-4 flex-1">
              <div className="space-y-4">

                {/* Nombre */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Nombre</span>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={INPUT_STYLE}
                  />
                </label>

                {/* Descripción */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Descripción</span>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                    style={INPUT_STYLE}
                  />
                </label>

                {/* Tipo */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Tipo de descuento</span>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as Promocion['tipo'] })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={INPUT_STYLE}
                  >
                    <option value="3x2">3×2 — lleva 3, paga 2</option>
                    <option value="porcentaje">Descuento en %</option>
                    <option value="fijo">Descuento fijo ($)</option>
                  </select>
                </label>

                {/* Valor */}
                {form.tipo !== '3x2' && (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                      Valor ({form.tipo === 'porcentaje' ? '%' : '$'})
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={form.valor}
                      onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      style={INPUT_STYLE}
                    />
                  </label>
                )}

                {/* ─── Alcance ─── */}
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>¿A qué productos aplica?</p>
                  <div className="flex flex-wrap gap-2">
                    {alcanceTab('todos')}
                    {alcanceTab('categorias')}
                    {alcanceTab('productos')}
                  </div>

                  {form.alcance === 'categorias' && (
                    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {menuCategorias.length === 0 ? (
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando categorías…</p>
                      ) : (
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {menuCategorias.map((cat) => (
                            <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={form.categoriaIds.includes(cat.id)}
                                onChange={() => toggleCategoria(cat.id)}
                                className="accent-red-600"
                              />
                              <span className="text-xs" style={{ color: '#F5F5F5' }}>
                                {cat.icono} {cat.nombre}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {form.alcance === 'productos' && (
                    <div className="rounded-xl p-3 space-y-3" style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', maxHeight: 240, overflowY: 'auto' }}>
                      {menuItems.length === 0 ? (
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>Cargando productos…</p>
                      ) : (
                        <>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>
                            {form.itemIds.length} producto(s) seleccionado(s)
                          </p>
                          {itemsPorCategoria.map(({ cat, items }) => (
                            <div key={cat.id}>
                              <p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>
                                {cat.icono} {cat.nombre}
                              </p>
                              <div className="pl-3 space-y-1.5">
                                {items.map((item) => (
                                  <label key={item.id} className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={form.itemIds.includes(item.id)}
                                      onChange={() => toggleItem(item.id)}
                                      className="accent-red-600"
                                    />
                                    <span className="text-xs flex-1" style={{ color: '#F5F5F5' }}>{item.nombre}</span>
                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>${item.precio}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ─── Días de validez ─── */}
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Días de validez</p>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.todosLosDias}
                      onChange={(e) => setForm({ ...form, todosLosDias: e.target.checked, diasSemana: [] })}
                      className="accent-red-600"
                    />
                    <span className="text-sm" style={{ color: '#F5F5F5' }}>Todos los días</span>
                  </label>
                  {!form.todosLosDias && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {DIAS.map((dia, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDia(i)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: form.diasSemana.includes(i) ? 'rgba(192,57,43,0.2)' : 'rgba(255,255,255,0.05)',
                            color: form.diasSemana.includes(i) ? '#C0392B' : '#9CA3AF',
                            border: `1px solid ${form.diasSemana.includes(i) ? 'rgba(192,57,43,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          }}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activa */}
                <label className="flex items-center gap-2 text-sm select-none" style={{ color: '#9CA3AF' }}>
                  <input
                    type="checkbox"
                    checked={form.activa}
                    onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                    className="accent-red-600"
                  />
                  Activa
                </label>

              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="px-6 pb-2 text-xs text-center" style={{ color: '#E74C3C' }}>
                {errorMsg}
              </p>
            )}

            {/* Botones — dentro del form */}
            <div className="flex gap-2 p-6 pt-4 shrink-0">
              <button
                type="button"
                onClick={reset}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de promociones */}
      {cargando ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#C0392B' }} />
        </div>
      ) : promociones.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Tag size={40} style={{ color: 'rgba(156,163,175,0.3)' }} />
          <p style={{ color: '#9CA3AF' }}>No hay promociones creadas</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {promociones.map((p) => (
            <div
              key={p.id}
              className="rounded-xl p-4 flex items-start justify-between gap-3"
              style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.05)', opacity: p.activa ? 1 : 0.5 }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#F5F5F5' }}>{p.nombre}</p>
                {p.descripcion && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{p.descripcion}</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                    {p.tipo === '3x2' ? '3×2' : p.tipo === 'porcentaje' ? `${p.valor}% OFF` : `-$${p.valor}`}
                  </span>
                  <button
                    onClick={() => toggleActiva(p)}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: p.activa ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.1)', color: p.activa ? '#22C55E' : '#9CA3AF' }}
                  >
                    {p.activa ? 'Activa' : 'Inactiva'}
                  </button>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#9CA3AF' }}>
                    📦 {resumenAlcance(p)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#9CA3AF' }}>
                    📅 {resumenDias(p)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => editar(p)} className="p-1.5 rounded-lg hover:opacity-80">
                  <Edit2 size={14} style={{ color: '#9CA3AF' }} />
                </button>
                <button onClick={() => eliminar(p.id)} className="p-1.5 rounded-lg hover:opacity-80">
                  <Trash2 size={14} style={{ color: '#C0392B' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
