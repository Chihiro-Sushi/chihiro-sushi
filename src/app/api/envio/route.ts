import { NextRequest, NextResponse } from 'next/server'
import { calcularCostoEnvio, KM_MAXIMO_ENVIO } from '@/lib/envio'

export async function GET(req: NextRequest) {
  const distanciaKm = parseFloat(req.nextUrl.searchParams.get('distanciaKm') ?? '0')
  const costo = calcularCostoEnvio(distanciaKm)

  if (costo === null) {
    return NextResponse.json(
      { error: `Fuera de zona de entrega (máximo ${KM_MAXIMO_ENVIO} km)` },
      { status: 422 }
    )
  }

  return NextResponse.json({ costo })
}
