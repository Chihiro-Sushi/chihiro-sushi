'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCarrito } from '@/context/CarritoContext'
import Navbar from '@/components/layout/Navbar'
import MapaPicker from '@/components/checkout/MapaPicker'
import { ShoppingBag, CreditCard, Banknote, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CondominioInfo {
  nombre: string
  coords?: { lat: number; lng: number }
  entradaOpcional?: boolean
  bloqueado?: boolean
}

const CONDOMINIOS_INFO: CondominioInfo[] = [
  { nombre: 'Corasol' },
  { nombre: 'Playacar' },
  { nombre: 'Mayakoba' },
  { nombre: 'El Cielo' },
  { nombre: 'Baiantun' },
  { nombre: 'Loltun', coords: { lat: 20.6725, lng: -87.048 } },
  { nombre: 'LolKaaTun', coords: { lat: 20.669, lng: -87.040 } },
  { nombre: 'XCALACOCO' },
  { nombre: 'Selvamar' },
  { nombre: 'Tigrillo-Campestre', coords: { lat: 20.6150650, lng: -87.1021010 } },
  { nombre: 'Cristo Rey' },
  { nombre: 'BALI', entradaOpcional: true },
  { nombre: 'THULA', coords: { lat: 20.6101347, lng: -87.1163146 }, entradaOpcional: true },
  { nombre: 'In House', bloqueado: true },
]

type MetodoPago = 'efectivo' | 'tarjeta'

interface DireccionData {
  direccion: string
  coordenadas: { lat: number; lng: number }
  distanciaKm: number
}

export default function CheckoutPage() {
  const { items, total, descuento, totalConDescuento, limpiar } = useCarrito()
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [direccionData, setDireccionData] = useState<DireccionData | null>(null)
  const [costoEnvio, setCostoEnvio] = useState<number | null>(null)
  const [surcargoClimatico, setSurcargoClimatico] = useState(0)
  const [fueraDeZona, setFueraDeZona] = useState(false)
  const [zonaRestringida, setZonaRestringida] = useState('')
  const [calculandoEnvio, setCalculandoEnvio] = useState(false)
  const [pagoEfectivo, setPagoEfectivo] = useState<'exacto' | 'cambio' | null>(null)
  const [condominioSeleccionado, setCondominioSeleccionado] = useState<string | null>(null)
  const [condominioRespondido, setCondominioRespondido] = useState(false)
  const [entradaCondominio, setEntradaCondominio] = useState<'carretera_federal' | 'la_joya' | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const condominioInfo = condominioSeleccionado
    ? CONDOMINIOS_INFO.find((c) => c.nombre === condominioSeleccionado)
    : null

  const inHouseBloqueado = condominioSeleccionado === 'In House'

  const surcargoCondominio = (() => {
    if (!condominioSeleccionado || condominioInfo?.bloqueado) return 0
    if (condominioInfo?.entradaOpcional) {
      if (entradaCondominio === 'carretera_federal') return 20
      if (entradaCondominio === 'la_joya') return 10
      return 0
    }
    return 10
  })()

  const cristoReyRestringido =
    condominioSeleccionado === 'Cristo Rey' && new Date().getHours() >= 18

  const mapQueryExterna =
    condominioSeleccionado && !condominioInfo?.coords && !condominioInfo?.bloqueado
      ? `${condominioSeleccionado} Playa del Carmen`
      : undefined

  const mapCoordsExternas = condominioInfo?.coords
    ? { ...condominioInfo.coords, nombre: condominioSeleccionado! }
    : undefined

  function handleSelectCondominio(nombre: string | null) {
    setCondominioSeleccionado(nombre)
    setCondominioRespondido(true)
    setEntradaCondominio(null)
  }

  function validarZona(direccion: string): string {
    const dir = direccion.toLowerCase()
    if (dir.includes('in house')) {
      return 'Lo sentimos, no realizamos entregas en esta zona.'
    }
    if (dir.includes('cristo rey')) {
      if (new Date().getHours() >= 18) {
        return 'Lo sentimos, no realizamos entregas a Cristo Rey después de las 6:00 pm.'
      }
    }
    return ''
  }

  const handleDireccionChange = useCallback(async (data: DireccionData) => {
    setDireccionData(data)
    setFueraDeZona(false)
    setCostoEnvio(null)
    setSurcargoClimatico(0)

    const restriccion = validarZona(data.direccion)
    setZonaRestringida(restriccion)
    if (restriccion) return

    setCalculandoEnvio(true)
    try {
      const res = await fetch(`/api/envio?distanciaKm=${data.distanciaKm.toFixed(2)}`)
      const json = await res.json()
      if (!res.ok) {
        setFueraDeZona(true)
      } else {
        setCostoEnvio(json.costo)
        setSurcargoClimatico(json.surcargoClimatico ?? 0)
      }
    } catch {
      setError('No se pudo calcular el costo de envío. Intenta de nuevo.')
    } finally {
      setCalculandoEnvio(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hora = new Date().getHours()
  const servicioSuspendido = hora < 14

  const totalSinComision = totalConDescuento + (costoEnvio ?? 0) + surcargoClimatico + surcargoCondominio
  const comisionStripe = metodoPago === 'tarjeta'
    ? Math.ceil(totalSinComision * 0.036 + 3)
    : 0
  const totalFinal = totalSinComision + comisionStripe

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (servicioSuspendido) { setError('El servicio no está disponible antes de las 2:00 pm'); return }
    if (!nombre.trim()) { setError('Ingresa tu nombre'); return }
    const soloDigitos = telefono.replace(/\D/g, '').replace(/^52/, '')
    if (soloDigitos.length !== 10) { setError('Ingresa un número de WhatsApp válido (10 dígitos)'); return }
    if (!condominioRespondido) { setError('Indica si vives en un condominio de la lista'); return }
    if (inHouseBloqueado) { setError('No realizamos envíos a la zona de In House'); return }
    if (cristoReyRestringido) { setError('Debido al horario, no hay servicio en Cristo Rey en este momento'); return }
    if (!direccionData) { setError('Selecciona tu dirección en el mapa'); return }
    if (items.length === 0) { setError('Tu carrito está vacío'); return }
    if (metodoPago === 'efectivo' && !pagoEfectivo) { setError('Selecciona si traes el monto exacto o necesitas cambio'); return }
    if (condominioInfo?.entradaOpcional && !entradaCondominio) {
      setError(`Selecciona la entrada para ${condominioSeleccionado}`)
      return
    }

    setEnviando(true)

    try {
      const pedidoData = {
        cliente: {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccionData.direccion,
          coordenadas: direccionData.coordenadas,
        },
        items,
        subtotal: total,
        costoEnvio: costoEnvio ?? 0,
        surcargoClimatico,
        surcargoCondominio,
        ...(condominioSeleccionado ? { condominio: condominioSeleccionado } : {}),
        ...(entradaCondominio ? { entradaCondominio } : {}),
        descuento,
        comisionTarjeta: comisionStripe,
        total: totalFinal,
        metodoPago,
        ...(metodoPago === 'efectivo' && pagoEfectivo ? { pagoEfectivo } : {}),
        notas: notas.trim(),
      }

      if (metodoPago === 'tarjeta') {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pedidoData),
        })
        const { url } = await res.json()
        if (url) { window.location.href = url; return }
        throw new Error('No se pudo crear la sesión de pago')
      }

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData),
      })

      if (res.status === 503) throw new Error('El delivery está suspendido temporalmente por condiciones climáticas. ¡Vuelve pronto!')
      if (!res.ok) throw new Error('Error al procesar el pedido')

      limpiar()
      router.push('/pedido-confirmado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo o contáctanos por WhatsApp.')
    } finally {
      setEnviando(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-4 text-center">
          <ShoppingBag size={56} style={{ color: 'rgba(156,163,175,0.3)' }} />
          <h2 className="text-xl font-semibold" style={{ color: '#F5F5F5' }}>Tu carrito está vacío</h2>
          <Link href="/#menu" className="text-sm px-6 py-2.5 rounded-full font-medium transition-colors"
            style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}>
            Ver el menú
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 hover:opacity-80 transition-opacity"
          style={{ color: '#9CA3AF' }}>
          <ArrowLeft size={16} /> Seguir comprando
        </Link>

        <h1 className="text-2xl font-black mb-8" style={{ color: '#F5F5F5' }}>
          Finalizar <span style={{ color: '#C0392B' }}>pedido</span>
        </h1>

        {servicioSuspendido && (
          <div className="flex items-center gap-3 rounded-xl p-4 mb-6 text-sm"
            style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#F87171' }}>
            <AlertCircle size={18} className="shrink-0" />
            <span>El servicio de entrega está disponible a partir de las <strong>2:00 pm</strong>. Puedes preparar tu pedido y confirmarlo después.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos personales */}
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold" style={{ color: '#F5F5F5' }}>Tus datos</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F5' }}
              />
              {(() => {
                const digitos = telefono.replace(/\D/g, '').replace(/^52/, '')
                const invalido = telefono.trim().length > 0 && digitos.length !== 10
                return (
                  <>
                    <input
                      type="tel"
                      placeholder="Tu teléfono de WhatsApp (10 dígitos)"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                      style={{
                        backgroundColor: '#0A0A0A',
                        border: `1px solid ${invalido ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        color: '#F5F5F5',
                      }}
                    />
                    {invalido && (
                      <p className="text-xs mt-1" style={{ color: '#F87171' }}>
                        Número inválido — ingresa 10 dígitos sin código de país
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Dirección */}
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold" style={{ color: '#F5F5F5' }}>Dirección de entrega</h2>

            {/* Selector rápido de condominios */}
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                ¿Vives en uno de estos condominios? <span style={{ color: '#C0392B' }}>*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {CONDOMINIOS_INFO.map(({ nombre: nom, bloqueado }) => {
                  const sel = condominioSeleccionado === nom
                  return (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => handleSelectCondominio(nom)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
                      style={{
                        border: sel
                          ? `1.5px solid ${bloqueado ? '#F87171' : '#C0392B'}`
                          : '1.5px solid rgba(255,255,255,0.1)',
                        backgroundColor: sel
                          ? bloqueado ? 'rgba(248,113,113,0.12)' : 'rgba(192,57,43,0.15)'
                          : 'transparent',
                        color: sel
                          ? bloqueado ? '#F87171' : '#C0392B'
                          : bloqueado ? 'rgba(248,113,113,0.5)' : '#9CA3AF',
                      }}
                    >
                      {nom}
                    </button>
                  )
                })}
                {/* Opción: no vive en ningún condominio */}
                <button
                  type="button"
                  onClick={() => handleSelectCondominio(null)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    border: condominioRespondido && !condominioSeleccionado
                      ? '1.5px solid rgba(255,255,255,0.35)'
                      : '1.5px solid rgba(255,255,255,0.1)',
                    backgroundColor: condominioRespondido && !condominioSeleccionado
                      ? 'rgba(255,255,255,0.07)'
                      : 'transparent',
                    color: condominioRespondido && !condominioSeleccionado ? '#F5F5F5' : '#9CA3AF',
                  }}
                >
                  No vivo en ninguno
                </button>
              </div>

              {!condominioRespondido && (
                <p className="text-xs" style={{ color: 'rgba(248,113,113,0.7)' }}>
                  Selecciona tu condominio o elige "No vivo en ninguno" para continuar.
                </p>
              )}

              {/* Mensaje bloqueante: In House */}
              {inHouseBloqueado && (
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#F87171' }}>
                  <AlertCircle size={13} className="shrink-0" />
                  Por el momento no realizamos envíos a la zona de In House.
                </div>
              )}

              {/* Advertencia Cristo Rey después de las 6pm */}
              {cristoReyRestringido && (
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#F87171' }}>
                  <AlertCircle size={13} className="shrink-0" />
                  Debido al horario, no hay servicio en Cristo Rey en este momento. Vuelve antes de las 6:00 pm.
                </div>
              )}

              {/* Sub-selector de entrada para BALI y THULA */}
              {condominioInfo?.entradaOpcional && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                    ¿Por qué entrada ingresas a {condominioSeleccionado}?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { valor: 'carretera_federal' as const, label: '🛣️ Carretera federal', extra: '+$20' },
                      { valor: 'la_joya' as const, label: '🏘️ Entrada La Joya', extra: '+$10' },
                    ]).map(({ valor, label, extra }) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => setEntradaCondominio(entradaCondominio === valor ? null : valor)}
                        className="flex flex-col gap-0.5 p-3 rounded-xl transition-all text-left"
                        style={{
                          border: entradaCondominio === valor ? '2px solid #C0392B' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: entradaCondominio === valor ? 'rgba(192,57,43,0.1)' : 'transparent',
                        }}
                      >
                        <span className="text-xs font-medium" style={{ color: entradaCondominio === valor ? '#C0392B' : '#F5F5F5' }}>
                          {label}
                        </span>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>{extra} al costo por distancia</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugerencia para condominios sin coords hardcodeadas */}
              {condominioSeleccionado && !condominioInfo?.entradaOpcional && !cristoReyRestringido && !inHouseBloqueado && (
                <p className="text-xs" style={{ color: 'rgba(156,163,175,0.6)' }}>
                  Selecciona tu dirección exacta en los resultados del mapa.
                </p>
              )}
            </div>

            <MapaPicker
              onChange={handleDireccionChange}
              queryExterna={mapQueryExterna}
              coordenadasExternas={mapCoordsExternas}
            />

            {costoEnvio !== null && !calculandoEnvio && (
              <div className="flex items-center justify-between text-sm rounded-lg px-4 py-3"
                style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)' }}>
                <span style={{ color: '#9CA3AF' }}>Costo de envío</span>
                <span className="font-bold" style={{ color: '#C0392B' }}>
                  ${costoEnvio.toFixed(2)}
                </span>
              </div>
            )}
            {zonaRestringida && (
              <div className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
                style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#F87171' }}>
                <AlertCircle size={15} className="shrink-0" />
                {zonaRestringida}
              </div>
            )}
            {fueraDeZona && !calculandoEnvio && (
              <div className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
                style={{ backgroundColor: 'rgba(251,176,64,0.1)', border: '1px solid rgba(251,176,64,0.3)', color: '#FBB040' }}>
                <AlertCircle size={15} className="shrink-0" />
                Tu dirección está fuera de nuestra zona de entrega (máx. 13 km). Contáctanos por WhatsApp para cotizar.
              </div>
            )}
            {calculandoEnvio && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#9CA3AF' }}>
                <Loader2 size={14} className="animate-spin" /> Calculando envío...
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold" style={{ color: '#F5F5F5' }}>Método de pago</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { valor: 'efectivo' as MetodoPago, label: 'Efectivo', Icon: Banknote },
                { valor: 'tarjeta' as MetodoPago, label: 'Tarjeta', Icon: CreditCard },
              ].map(({ valor, label, Icon }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => { setMetodoPago(valor); if (valor === 'tarjeta') setPagoEfectivo(null) }}
                  className="flex items-center gap-3 p-4 rounded-xl border transition-all"
                  style={{
                    border: metodoPago === valor ? '2px solid #C0392B' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: metodoPago === valor ? 'rgba(192,57,43,0.1)' : 'transparent',
                    color: metodoPago === valor ? '#C0392B' : '#9CA3AF',
                  }}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>
            {metodoPago === 'efectivo' && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>¿Cómo vas a pagar?</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { valor: 'exacto' as const, label: '💰 Pago exacto', desc: 'Llevaré el monto exacto' },
                    { valor: 'cambio' as const, label: '💵 Necesito cambio', desc: 'Me darán cambio' },
                  ] as const).map(({ valor, label, desc }) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setPagoEfectivo(valor)}
                      className="flex flex-col gap-0.5 p-3 rounded-xl transition-all text-left"
                      style={{
                        border: pagoEfectivo === valor ? '2px solid #C0392B' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: pagoEfectivo === valor ? 'rgba(192,57,43,0.1)' : 'transparent',
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: pagoEfectivo === valor ? '#C0392B' : '#F5F5F5' }}>{label}</span>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {metodoPago === 'tarjeta' && (
              <p className="text-xs" style={{ color: 'rgba(156,163,175,0.7)' }}>
                Serás redirigido a una página segura para completar el pago con tarjeta.
              </p>
            )}
          </div>

          {/* Notas */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold mb-3" style={{ color: '#F5F5F5' }}>Notas (opcional)</h2>
            <textarea
              placeholder="Instrucciones especiales, alergias, punto de referencia..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F5' }}
            />
          </div>

          {/* Resumen */}
          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="font-semibold mb-2" style={{ color: '#F5F5F5' }}>Resumen</h2>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm" style={{ color: '#9CA3AF' }}>
                <span>{item.cantidad}x {item.nombre}{item.variante ? ` (${item.variante})` : ''}</span>
                <span>${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between text-sm" style={{ color: '#9CA3AF' }}>
                <span>Subtotal</span><span>${total.toFixed(2)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm font-medium" style={{ color: '#22C55E' }}>
                  <span>Descuento 3×2</span><span>-${descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm" style={{ color: '#9CA3AF' }}>
                <span>Envío</span>
                <span>{costoEnvio !== null ? `$${costoEnvio.toFixed(2)}` : 'Por calcular'}</span>
              </div>
              {surcargoCondominio > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#9CA3AF' }}>
                  <span>🏘️ Cargo condominio{entradaCondominio === 'carretera_federal' ? ' (carretera federal)' : ''}</span>
                  <span>+${surcargoCondominio.toFixed(2)}</span>
                </div>
              )}
              {surcargoClimatico > 0 && (
                <div className="flex justify-between items-center text-sm rounded-lg px-3 py-2 -mx-3"
                  style={{ backgroundColor: 'rgba(251,176,64,0.08)', border: '1px solid rgba(251,176,64,0.2)', color: '#FBB040' }}>
                  <span>🌧️ Tarifa por condiciones climáticas</span>
                  <span className="font-semibold">+${surcargoClimatico.toFixed(2)}</span>
                </div>
              )}
              {metodoPago === 'tarjeta' && (
                <div className="flex justify-between text-sm" style={{ color: '#9CA3AF' }}>
                  <span>Cargo por pago con tarjeta</span>
                  <span>${comisionStripe.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1" style={{ color: '#F5F5F5' }}>
                <span>Total</span><span style={{ color: '#C0392B' }}>${totalFinal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl p-4 text-sm"
              style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#F87171' }}>
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              enviando ||
              servicioSuspendido ||
              !condominioRespondido ||
              inHouseBloqueado ||
              cristoReyRestringido ||
              !direccionData ||
              fueraDeZona ||
              !!zonaRestringida ||
              costoEnvio === null ||
              (metodoPago === 'efectivo' && !pagoEfectivo) ||
              (!!condominioInfo?.entradaOpcional && !entradaCondominio)
            }
            className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#C0392B', color: '#F5F5F5' }}
          >
            {enviando
              ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
              : metodoPago === 'tarjeta'
              ? <><CreditCard size={18} /> Pagar con tarjeta — ${totalFinal.toFixed(2)}</>
              : <><ShoppingBag size={18} /> Confirmar pedido — ${totalFinal.toFixed(2)}</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
