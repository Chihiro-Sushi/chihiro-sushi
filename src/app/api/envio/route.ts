import { NextRequest, NextResponse } from 'next/server'
import { calcularCostoEnvio, KM_MAXIMO_ENVIO } from '@/lib/envio'
import { getAdminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const distanciaKm = parseFloat(req.nextUrl.searchParams.get('distanciaKm') ?? '0')
  const costo = calcularCostoEnvio(distanciaKm)

  if (costo === null) {
    return NextResponse.json(
      { error: `Fuera de zona de entrega (máximo ${KM_MAXIMO_ENVIO} km)` },
      { status: 422 }
    )
  }

  let surcargoClimatico = 0
  try {
    const db = getAdminDb()
    const snap = await db.collection('configuracion').doc('sitio').get()
    if (snap.exists) {
      const config = snap.data()
      if (config?.tarifaClimaticaActiva) {
        surcargoClimatico = config.montoClimatico ?? 10
      }
    }
  } catch {
    // no bloquear el cálculo si falla la lectura de config
  }

  return NextResponse.json({ costo, surcargoClimatico })
}
