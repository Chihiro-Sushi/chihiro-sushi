'use client'

import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type { Categoria, MenuItem, Variante } from '@/types'
import {
  Plus, Edit2, Trash2, Loader2, X, Check, Upload,
  ImageIcon, Tag, Layers, ChevronDown, ChevronUp,
} from 'lucide-react'

/* ─── helpers UI ─────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(156,163,175,0.7)' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all'
const inputStyle = { backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F5F5' }
const inputFocusStyle = { '--tw-ring-color': 'rgba(192,57,43,0.5)' } as React.CSSProperties

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} style={{ ...inputStyle, ...inputFocusStyle }} />
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`${inputCls} resize-none`}
      style={{ ...inputStyle, ...inputFocusStyle }}
    />
  )
}

/* ─── constantes ─────────────────────────────────────────── */

const ITEM_VACIO: Omit<MenuItem, 'id'> = {
  categoriaId: '',
  nombre: '',
  descripcion: '',
  precio: 0,
  disponible: true,
  orden: 0,
  etiquetas: [],
  variantes: [],
  imagenUrl: '',
}

/* ─── componente principal ───────────────────────────────── */

export default function MenuAdminPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [cargando, setCargando] = useState(true)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formItem, setFormItem] = useState<Omit<MenuItem, 'id'>>(ITEM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const [etiquetaInput, setEtiquetaInput] = useState('')
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── realtime ── */
  useEffect(() => {
    const unsubCat = onSnapshot(
      query(collection(db, 'menu_categorias'), orderBy('orden')),
      (snap) => {
        const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Categoria))
        setCategorias(cats)
        setCategoriaExpandida((prev) => prev ?? cats[0]?.id ?? null)
      }
    )
    const unsubItems = onSnapshot(
      query(collection(db, 'menu_items'), orderBy('orden')),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem)))
        setCargando(false)
      }
    )
    return () => { unsubCat(); unsubItems() }
  }, [])

  /* ── imagen ── */
  function cargarImagen(file: File) {
    if (!file.type.startsWith('image/')) return
    setImagenFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagenPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) cargarImagen(file)
  }

  function quitarImagen() {
    setImagenFile(null)
    setImagenPreview('')
    setFormItem((f) => ({ ...f, imagenUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── variantes ── */
  function agregarVariante() {
    setFormItem((f) => ({ ...f, variantes: [...(f.variantes ?? []), { nombre: '', precioExtra: 0 }] }))
  }

  function actualizarVariante(i: number, campo: keyof Variante, valor: string | number) {
    setFormItem((f) => {
      const vs = [...(f.variantes ?? [])]
      vs[i] = { ...vs[i], [campo]: valor }
      return { ...f, variantes: vs }
    })
  }

  function eliminarVarianteRow(i: number) {
    setFormItem((f) => ({ ...f, variantes: (f.variantes ?? []).filter((_, j) => j !== i) }))
  }

  /* ── etiquetas ── */
  function agregarEtiqueta() {
    const tag = etiquetaInput.trim()
    if (!tag || formItem.etiquetas?.includes(tag)) return
    setFormItem((f) => ({ ...f, etiquetas: [...(f.etiquetas ?? []), tag] }))
    setEtiquetaInput('')
  }

  function eliminarEtiqueta(tag: string) {
    setFormItem((f) => ({ ...f, etiquetas: (f.etiquetas ?? []).filter((e) => e !== tag) }))
  }

  /* ── form ── */
  function abrirNuevo() {
    setFormItem({ ...ITEM_VACIO, categoriaId: categorias[0]?.id ?? '' })
    setEditandoId(null)
    setImagenFile(null)
    setImagenPreview('')
    setEtiquetaInput('')
    setMostrarForm(true)
  }

  function editarItem(item: MenuItem) {
    setFormItem({
      categoriaId: item.categoriaId,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      precio: item.precio,
      disponible: item.disponible,
      orden: item.orden,
      etiquetas: item.etiquetas ?? [],
      variantes: item.variantes ?? [],
      imagenUrl: item.imagenUrl ?? '',
    })
    setEditandoId(item.id)
    setImagenFile(null)
    setImagenPreview(item.imagenUrl ?? '')
    setEtiquetaInput('')
    setMostrarForm(true)
  }

  function resetForm() {
    setMostrarForm(false)
    setEditandoId(null)
    setImagenFile(null)
    setImagenPreview('')
    setEtiquetaInput('')
  }

  async function guardarItem(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      let imagenUrl = formItem.imagenUrl ?? ''

      if (imagenFile) {
        setSubiendoImagen(true)
        const sRef = storageRef(storage, `menu_items/${Date.now()}_${imagenFile.name}`)
        await uploadBytes(sRef, imagenFile)
        imagenUrl = await getDownloadURL(sRef)
        setSubiendoImagen(false)
      }

      const data = {
        ...formItem,
        imagenUrl,
        variantes: (formItem.variantes ?? []).filter((v) => v.nombre.trim() !== ''),
      }

      if (editandoId) {
        await updateDoc(doc(db, 'menu_items', editandoId), data)
      } else {
        await addDoc(collection(db, 'menu_items'), { ...data, orden: items.length })
      }
      resetForm()
    } finally {
      setGuardando(false)
      setSubiendoImagen(false)
    }
  }

  async function toggleDisponible(item: MenuItem) {
    await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible: !item.disponible }),
    })
  }

  async function eliminarItem(id: string) {
    if (!confirm('¿Eliminar este platillo?')) return
    await deleteDoc(doc(db, 'menu_items', id))
  }

  /* ── render ── */
  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: '#C0392B' }} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#F5F5F5' }}>Gestión de Menú</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {items.length} platillos · {items.filter((i) => !i.disponible).length} inactivos
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
          style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
        >
          <Plus size={15} /> Agregar platillo
        </button>
      </div>

      {/* ── MODAL FORM ── */}
      {mostrarForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) resetForm() }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: '#141414',
              border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: '92vh',
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="font-bold text-base" style={{ color: '#F5F5F5' }}>
                {editandoId ? 'Editar platillo' : 'Nuevo platillo'}
              </h2>
              <button onClick={resetForm} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
                <X size={18} style={{ color: '#9CA3AF' }} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <form onSubmit={guardarItem} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Imagen drag-and-drop */}
              <Field label="Imagen">
                <div
                  className="relative rounded-xl overflow-hidden cursor-pointer transition-all"
                  style={{
                    border: dragOver
                      ? '2px dashed #C0392B'
                      : imagenPreview
                      ? '2px solid rgba(255,255,255,0.08)'
                      : '2px dashed rgba(255,255,255,0.12)',
                    backgroundColor: dragOver ? 'rgba(192,57,43,0.08)' : '#0d0d0d',
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !imagenPreview && fileInputRef.current?.click()}
                >
                  {imagenPreview ? (
                    <div className="relative">
                      <img
                        src={imagenPreview}
                        alt="Preview"
                        className="w-full object-cover"
                        style={{ maxHeight: 180 }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
                        >
                          <Upload size={13} /> Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); quitarImagen() }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#F5F5F5' }}
                        >
                          <X size={13} /> Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <ImageIcon size={20} style={{ color: 'rgba(156,163,175,0.5)' }} />
                      </div>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        Arrastra una imagen aquí
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(156,163,175,0.4)' }}>
                        o haz click para seleccionar
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) cargarImagen(f) }}
                />
                {subiendoImagen && (
                  <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: '#9CA3AF' }}>
                    <Loader2 size={11} className="animate-spin" /> Subiendo imagen...
                  </p>
                )}
              </Field>

              {/* Categoría */}
              <Field label="Categoría">
                <select
                  value={formItem.categoriaId}
                  onChange={(e) => setFormItem((f) => ({ ...f, categoriaId: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                  ))}
                </select>
              </Field>

              {/* Nombre */}
              <Field label="Nombre del platillo">
                <TextInput
                  value={formItem.nombre}
                  onChange={(e) => setFormItem((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. Salmón Horneado"
                  required
                />
              </Field>

              {/* Descripción */}
              <Field label="Descripción">
                <TextArea
                  value={formItem.descripcion}
                  onChange={(e) => setFormItem((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="PD: ...\nPF: ..."
                />
              </Field>

              {/* Precio y Orden en fila */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio (MXN)">
                  <TextInput
                    type="number"
                    min={0}
                    step={0.5}
                    value={formItem.precio}
                    onChange={(e) => setFormItem((f) => ({ ...f, precio: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </Field>
                <Field label="Orden de aparición">
                  <TextInput
                    type="number"
                    min={0}
                    value={formItem.orden}
                    onChange={(e) => setFormItem((f) => ({ ...f, orden: parseInt(e.target.value) || 0 }))}
                  />
                </Field>
              </div>

              {/* Disponible toggle */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F5F5F5' }}>Disponible</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {formItem.disponible ? 'Se muestra en el menú' : 'Oculto para clientes'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormItem((f) => ({ ...f, disponible: !f.disponible }))}
                  className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0"
                  style={{ backgroundColor: formItem.disponible ? '#C0392B' : 'rgba(255,255,255,0.1)' }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: '#F5F5F5',
                      left: formItem.disponible ? 'calc(100% - 1.375rem)' : '2px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }}
                  />
                </button>
              </div>

              {/* Variantes */}
              <Field label={`Variantes ${formItem.variantes?.length ? `(${formItem.variantes.length})` : ''}`}>
                <div className="space-y-2">
                  {(formItem.variantes ?? []).map((v, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <TextInput
                        placeholder="Nombre (ej. Empanizar)"
                        value={v.nombre}
                        onChange={(e) => actualizarVariante(i, 'nombre', e.target.value)}
                        style={{ ...inputStyle, flex: 2 }}
                      />
                      <div className="relative shrink-0" style={{ flex: 1 }}>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9CA3AF' }}>+$</span>
                        <TextInput
                          type="number"
                          min={0}
                          placeholder="0"
                          value={v.precioExtra}
                          onChange={(e) => actualizarVariante(i, 'precioExtra', parseFloat(e.target.value) || 0)}
                          style={{ ...inputStyle, paddingLeft: '2rem' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarVarianteRow(i)}
                        className="p-2 rounded-lg shrink-0 transition-opacity hover:opacity-70"
                        style={{ backgroundColor: 'rgba(192,57,43,0.1)' }}
                      >
                        <X size={14} style={{ color: '#C0392B' }} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={agregarVariante}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl w-full transition-all hover:opacity-80"
                    style={{ border: '1px dashed rgba(255,255,255,0.1)', color: '#9CA3AF' }}
                  >
                    <Plus size={13} /> Añadir variante
                  </button>
                </div>
              </Field>

              {/* Etiquetas */}
              <Field label="Etiquetas">
                <div className="flex gap-2">
                  <TextInput
                    placeholder="Ej. Picante, Vegano..."
                    value={etiquetaInput}
                    onChange={(e) => setEtiquetaInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarEtiqueta() } }}
                  />
                  <button
                    type="button"
                    onClick={agregarEtiqueta}
                    className="shrink-0 px-3 rounded-xl text-sm transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(192,57,43,0.15)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}
                  >
                    <Tag size={15} />
                  </button>
                </div>
                {(formItem.etiquetas ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formItem.etiquetas!.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(192,57,43,0.12)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.25)' }}
                      >
                        {tag}
                        <button type="button" onClick={() => eliminarEtiqueta(tag)} className="hover:opacity-70">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              {/* Botones */}
              <div className="flex gap-2 pt-2 pb-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
                >
                  {guardando
                    ? <><Loader2 size={15} className="animate-spin" /> {subiendoImagen ? 'Subiendo...' : 'Guardando...'}</>
                    : <><Check size={15} /> {editandoId ? 'Guardar cambios' : 'Crear platillo'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LISTA DE PLATILLOS ── */}
      <div className="space-y-3">
        {categorias.map((cat) => {
          const catItems = items.filter((i) => i.categoriaId === cat.id)
          const expandida = categoriaExpandida === cat.id

          return (
            <div
              key={cat.id}
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)', backgroundColor: '#141414' }}
            >
              {/* Header de categoría */}
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 transition-opacity hover:opacity-80"
                onClick={() => setCategoriaExpandida(expandida ? null : cat.id)}
              >
                <div className="flex items-center gap-2">
                  {cat.icono && <span className="text-lg">{cat.icono}</span>}
                  <span className="font-semibold text-sm" style={{ color: '#F5F5F5' }}>{cat.nombre}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>
                    {catItems.length}
                  </span>
                  {catItems.some((i) => !i.disponible) && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(251,176,64,0.1)', color: '#FBB040' }}>
                      {catItems.filter((i) => !i.disponible).length} inactivo{catItems.filter((i) => !i.disponible).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {expandida ? <ChevronUp size={16} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={16} style={{ color: '#9CA3AF' }} />}
              </button>

              {/* Platillos */}
              {expandida && (
                <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {catItems.length === 0 ? (
                    <p className="text-xs text-center py-6" style={{ color: 'rgba(156,163,175,0.4)' }}>
                      Sin platillos en esta categoría
                    </p>
                  ) : (
                    catItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-5 py-3 border-b last:border-b-0 transition-all"
                        style={{
                          borderColor: 'rgba(255,255,255,0.04)',
                          opacity: item.disponible ? 1 : 0.55,
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="w-11 h-11 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          {item.imagenUrl ? (
                            <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={18} style={{ color: 'rgba(156,163,175,0.3)' }} />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#F5F5F5' }}>{item.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold" style={{ color: '#C0392B' }}>${item.precio}</span>
                            {(item.variantes?.length ?? 0) > 0 && (
                              <span className="text-xs" style={{ color: 'rgba(156,163,175,0.5)' }}>
                                <Layers size={11} className="inline mr-0.5" />{item.variantes!.length} variante{item.variantes!.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {(item.etiquetas?.length ?? 0) > 0 && (
                              <span className="text-xs" style={{ color: 'rgba(156,163,175,0.5)' }}>
                                <Tag size={11} className="inline mr-0.5" />{item.etiquetas!.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleDisponible(item) }}
                            className="text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-80"
                            style={{
                              backgroundColor: item.disponible ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.08)',
                              color: item.disponible ? '#22C55E' : '#9CA3AF',
                              border: `1px solid ${item.disponible ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                          >
                            {item.disponible ? '● Activo' : '○ Inactivo'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); editarItem(item) }}
                            className="p-2 rounded-xl transition-all hover:opacity-80"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                            title="Editar"
                          >
                            <Edit2 size={14} style={{ color: '#9CA3AF' }} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); eliminarItem(item.id) }}
                            className="p-2 rounded-xl transition-all hover:opacity-80"
                            style={{ backgroundColor: 'rgba(192,57,43,0.08)' }}
                            title="Eliminar"
                          >
                            <Trash2 size={14} style={{ color: '#C0392B' }} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
