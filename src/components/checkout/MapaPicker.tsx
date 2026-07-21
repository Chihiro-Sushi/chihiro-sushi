'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Loader2, LocateFixed } from 'lucide-react'
import { RESTAURANTE_COORDS, calcularDistanciaRuta } from '@/lib/envio'

interface Props {
  onChange: (datos: {
    direccion: string
    coordenadas: { lat: number; lng: number }
    distanciaKm: number
  }) => void
  queryExterna?: string
  coordenadasExternas?: { lat: number; lng: number; nombre: string }
}

interface Sugerencia {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export default function MapaPicker({ onChange, queryExterna, coordenadasExternas }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const prevQueryExternaRef = useRef<string | undefined>(undefined)
  const prevCoordsKeyRef = useRef<string | undefined>(undefined)

  const [busqueda, setBusqueda] = useState('')
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [buscando, setBuscando] = useState(false)
  const [cargandoMapa, setCargandoMapa] = useState(true)
  const [errorRuta, setErrorRuta] = useState(false)
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState('')

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return
    let mounted = true

    async function init() {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
        await new Promise((r) => setTimeout(r, 120))
      }

      const L = (await import('leaflet')).default
      if (!mounted || !mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center: [RESTAURANTE_COORDS.lat, RESTAURANTE_COORDS.lng],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      if (mounted) setCargandoMapa(false)
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const colocarMarcador = useCallback(async (lat: number, lng: number, direccion: string) => {
    const L = (await import('leaflet')).default
    const map = mapInstanceRef.current
    if (!map) return

    map.setView([lat, lng], 16)
    if (markerRef.current) markerRef.current.remove()

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#C0392B;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
    markerRef.current = marker

    try {
      setErrorRuta(false)
      const distanciaKm = await calcularDistanciaRuta(RESTAURANTE_COORDS.lat, RESTAURANTE_COORDS.lng, lat, lng)
      onChange({ direccion, coordenadas: { lat, lng }, distanciaKm })
    } catch {
      setErrorRuta(true)
      return
    }

    marker.on('dragend', async () => {
      const pos = marker.getLatLng()
      const newLat = pos.lat
      const newLng = pos.lng

      let nuevaDireccion = direccion
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`,
          { headers: { 'Accept-Language': 'es', 'User-Agent': 'ChihiroSushiApp/1.0' } }
        )
        const data = await res.json()
        if (data.display_name) {
          nuevaDireccion = data.display_name
          setBusqueda(data.display_name)
        }
      } catch {
        // mantiene la dirección anterior si falla
      }

      try {
        setErrorRuta(false)
        const newDistancia = await calcularDistanciaRuta(RESTAURANTE_COORDS.lat, RESTAURANTE_COORDS.lng, newLat, newLng)
        onChange({ direccion: nuevaDireccion, coordenadas: { lat: newLat, lng: newLng }, distanciaKm: newDistancia })
      } catch {
        setErrorRuta(true)
      }
    })
  }, [onChange])

  const buscarDireccion = useCallback((query: string) => {
    setSugerencias([])
    if (query.trim().length < 4) return

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          limit: '5',
          countrycodes: 'mx',
          viewbox: '-87.15,20.75,-86.95,20.55',
          bounded: '0',
        })
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { 'Accept-Language': 'es', 'User-Agent': 'ChihiroSushiApp/1.0' },
        })
        const data: Sugerencia[] = await res.json()
        setSugerencias(data)
      } catch {
        // falla silenciosa — el usuario puede seguir escribiendo
      } finally {
        setBuscando(false)
      }
    }, 500)
  }, [])

  // Pre-llena la búsqueda cuando se selecciona un condominio sin coords hardcodeadas
  useEffect(() => {
    if (!queryExterna || queryExterna === prevQueryExternaRef.current) return
    prevQueryExternaRef.current = queryExterna
    setBusqueda(queryExterna)
    buscarDireccion(queryExterna)
  }, [queryExterna, buscarDireccion])

  // Coloca el pin directamente cuando se selecciona un condominio con coords hardcodeadas
  useEffect(() => {
    if (!coordenadasExternas) return
    const key = `${coordenadasExternas.lat},${coordenadasExternas.lng}`
    if (key === prevCoordsKeyRef.current) return
    prevCoordsKeyRef.current = key
    setBusqueda(coordenadasExternas.nombre)
    setSugerencias([])
    colocarMarcador(coordenadasExternas.lat, coordenadasExternas.lng, coordenadasExternas.nombre)
  }, [coordenadasExternas, colocarMarcador])

  async function seleccionarSugerencia(s: Sugerencia) {
    setBusqueda(s.display_name)
    setSugerencias([])
    await colocarMarcador(parseFloat(s.lat), parseFloat(s.lon), s.display_name)
  }

  function usarMiUbicacion() {
    setErrorUbicacion('')

    if (!navigator.geolocation) {
      setErrorUbicacion('Tu navegador no soporta compartir ubicación.')
      return
    }

    setObteniendoUbicacion(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        let direccion = 'Mi ubicación actual'
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'es', 'User-Agent': 'ChihiroSushiApp/1.0' } }
          )
          const data = await res.json()
          if (data.display_name) direccion = data.display_name
        } catch {
          // mantiene el nombre genérico si falla el reverse-geocode
        }

        setBusqueda(direccion)
        setSugerencias([])
        await colocarMarcador(lat, lng, direccion)
        setObteniendoUbicacion(false)
      },
      (err) => {
        setObteniendoUbicacion(false)
        if (err.code === err.PERMISSION_DENIED) {
          setErrorUbicacion('No diste permiso para acceder a tu ubicación. Puedes buscar tu dirección manualmente.')
        } else {
          setErrorUbicacion('No se pudo obtener tu ubicación. Intenta de nuevo o busca tu dirección manualmente.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#C0392B', zIndex: 1 }} />
        <input
          type="text"
          placeholder="Busca tu dirección en Playa del Carmen..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            buscarDireccion(e.target.value)
          }}
          onBlur={() => setTimeout(() => setSugerencias([]), 200)}
          autoComplete="off"
          className="w-full rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none"
          style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F5' }}
        />
        {buscando && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: '#9CA3AF' }} />
        )}
        {sugerencias.length > 0 && (
          <ul
            className="absolute w-full mt-1 rounded-xl overflow-hidden text-sm"
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.12)',
              top: '100%',
              zIndex: 1000,
            }}
          >
            {sugerencias.map((s) => (
              <li key={s.place_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onMouseDown={() => seleccionarSugerencia(s)}
                  className="w-full text-left px-4 py-2.5 hover:opacity-70 transition-opacity"
                  style={{ color: '#F5F5F5' }}
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={usarMiUbicacion}
        disabled={obteniendoUbicacion}
        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B' }}
      >
        {obteniendoUbicacion
          ? <><Loader2 size={15} className="animate-spin" /> Obteniendo tu ubicación...</>
          : <><LocateFixed size={15} /> Usar mi ubicación actual</>
        }
      </button>

      {errorUbicacion && (
        <p className="text-xs rounded-xl px-3 py-2.5 text-center"
          style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#F87171' }}>
          {errorUbicacion}
        </p>
      )}

      {busqueda && !buscando && sugerencias.length === 0 && (
        <p className="text-xs" style={{ color: 'rgba(156,163,175,0.6)' }}>
          Puedes arrastrar el pin rojo para ajustar el punto de entrega exacto.
        </p>
      )}

      {errorRuta && (
        <p className="text-xs rounded-xl px-3 py-2.5 text-center"
          style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#F87171' }}>
          No se pudo calcular la distancia. Por favor selecciona tu dirección de nuevo.
        </p>
      )}

      <div
        className="relative rounded-xl overflow-hidden"
        style={{ height: 220, border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {cargandoMapa && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: '#141414', zIndex: 10 }}
          >
            <Loader2 size={24} className="animate-spin" style={{ color: '#C0392B' }} />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  )
}
