'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ConfiguracionSitio } from '@/types'
import { Loader2, Save, Check } from 'lucide-react'

const CONFIG_INICIAL: ConfiguracionSitio = {
  nombreRestaurante: 'Chihiro Sushi',
  slogan: '¡Un viaje de sabor en cada bocado!',
  telefono: '(984) 313 9064',
  horario: 'Lun–Dom 13:00–23:00 hrs',
  imagenPortada: '',
  imagenesGaleria: [],
  textoDestacado: '🎉 3×2 todos los días — Sopas, Rollos, Yakimeshis y Kushiages',
  redesSociales: { facebook: 'Chihiro Sushi', instagram: 'Sushi_Chihiro', whatsapp: '9843139064' },
  tarifaEnvioBase: 30,
  tarifaPorKm: 10,
  kmMaximoEnvio: 15,
}

function CampoInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</span>
      <input {...props} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F5F5' }} />
    </label>
  )
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionSitio>(CONFIG_INICIAL)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'configuracion', 'sitio')).then((snap) => {
      if (snap.exists()) setConfig(snap.data() as ConfiguracionSitio)
      setCargando(false)
    })
  }, [])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      await setDoc(doc(db, 'configuracion', 'sitio'), config)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } finally { setGuardando(false) }
  }

  if (cargando) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin" style={{ color: '#C0392B' }} /></div>

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-black mb-6" style={{ color: '#F5F5F5' }}>Configuración del sitio</h1>
      <form onSubmit={guardar} className="space-y-6">

        {/* Información general */}
        <section className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#F5F5F5' }}>Información general</h2>
          <CampoInput label="Nombre del restaurante" value={config.nombreRestaurante}
            onChange={(e) => setConfig({ ...config, nombreRestaurante: e.target.value })} />
          <CampoInput label="Slogan" value={config.slogan}
            onChange={(e) => setConfig({ ...config, slogan: e.target.value })} />
          <CampoInput label="Texto destacado (portada)" value={config.textoDestacado}
            onChange={(e) => setConfig({ ...config, textoDestacado: e.target.value })} />
          <CampoInput label="Horario" value={config.horario}
            onChange={(e) => setConfig({ ...config, horario: e.target.value })} />
          <CampoInput label="Teléfono / WhatsApp" value={config.telefono}
            onChange={(e) => setConfig({ ...config, telefono: e.target.value })} />
        </section>

        {/* Redes sociales */}
        <section className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#F5F5F5' }}>Redes sociales</h2>
          <CampoInput label="Facebook (nombre de página)" value={config.redesSociales.facebook ?? ''}
            onChange={(e) => setConfig({ ...config, redesSociales: { ...config.redesSociales, facebook: e.target.value } })} />
          <CampoInput label="Instagram (usuario)" value={config.redesSociales.instagram ?? ''}
            onChange={(e) => setConfig({ ...config, redesSociales: { ...config.redesSociales, instagram: e.target.value } })} />
          <CampoInput label="WhatsApp (número sin +52)" value={config.redesSociales.whatsapp ?? ''}
            onChange={(e) => setConfig({ ...config, redesSociales: { ...config.redesSociales, whatsapp: e.target.value } })} />
        </section>

        {/* Tarifas de envío */}
        <section className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#F5F5F5' }}>Tarifas de envío</h2>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Módulo demo. Costo = Base + (Km × Precio por km).
          </p>
          <div className="grid grid-cols-3 gap-3">
            <CampoInput label="Tarifa base ($)" type="number" min={0} value={config.tarifaEnvioBase}
              onChange={(e) => setConfig({ ...config, tarifaEnvioBase: parseFloat(e.target.value) })} />
            <CampoInput label="Precio por km ($)" type="number" min={0} step={0.5} value={config.tarifaPorKm}
              onChange={(e) => setConfig({ ...config, tarifaPorKm: parseFloat(e.target.value) })} />
            <CampoInput label="Km máximo" type="number" min={1} value={config.kmMaximoEnvio}
              onChange={(e) => setConfig({ ...config, kmMaximoEnvio: parseInt(e.target.value) })} />
          </div>
        </section>

        <button type="submit" disabled={guardando}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: guardado ? '#22C55E' : '#C0392B', color: '#F5F5F5' }}>
          {guardando ? <Loader2 size={16} className="animate-spin" /> : guardado ? <Check size={16} /> : <Save size={16} />}
          {guardado ? '¡Guardado!' : guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
