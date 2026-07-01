import { NextRequest, NextResponse } from 'next/server'
import { RESTAURANTE_COORDS } from '@/lib/envio'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Faltan coordenadas' }, { status: 400 })
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
  }

  const origins = `${RESTAURANTE_COORDS.lat},${RESTAURANTE_COORDS.lng}`
  const destinations = `${lat},${lng}`
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&key=${key}&language=es`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()

    if (
      data.status === 'OK' &&
      data.rows?.[0]?.elements?.[0]?.status === 'OK'
    ) {
      const distanciaKm = data.rows[0].elements[0].distance.value / 1000
      return NextResponse.json({ distanciaKm })
    }

    return NextResponse.json({ error: 'Sin ruta disponible' }, { status: 422 })
  } catch {
    return NextResponse.json({ error: 'Error al consultar Google Maps' }, { status: 500 })
  }
}
