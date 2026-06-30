export const RESTAURANTE_COORDS = {
  lat: 20.6601733,
  lng: -87.0755267,
}

// Tarifario por tramos (MXN). Rangos exactos según tarifario oficial.
// Después de 13.1 km la tarifa es especial (cotizar con administración).
const TRAMOS: { minKm: number; maxKm: number; costo: number }[] = [
  { minKm: 0,    maxKm: 3.0,  costo: 40 },
  { minKm: 3.1,  maxKm: 5.0,  costo: 50 },
  { minKm: 5.1,  maxKm: 7.0,  costo: 60 },
  { minKm: 7.1,  maxKm: 9.0,  costo: 70 },
  { minKm: 9.1,  maxKm: 11.0, costo: 80 },
  { minKm: 11.1, maxKm: 13.0, costo: 95 },
]

export const KM_MAXIMO_ENVIO = 13

// Retorna el costo de envío según el tramo correspondiente,
// o null si la distancia supera el área de cobertura.
// Se redondea a 1 decimal para coincidir exactamente con los rangos del tarifario.
export function calcularCostoEnvio(distanciaKm: number): number | null {
  const d = Math.round(distanciaKm * 10) / 10
  const tramo = TRAMOS.find((t) => d >= t.minKm && d <= t.maxKm)
  return tramo ? tramo.costo : null
}

// Calcula distancia en km entre dos coordenadas usando la fórmula de Haversine.
// Se usa como fallback si OSRM no responde.
export function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Calcula distancia real por carretera usando OSRM (OpenStreetMap routing).
// Si falla, regresa la distancia en línea recta como respaldo.
export async function calcularDistanciaRuta(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number> {
  try {
    // OSRM espera coordenadas en orden lng,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.code === 'Ok' && data.routes?.[0]) {
      return data.routes[0].distance / 1000
    }
  } catch {
    // falla silenciosa — usa Haversine como respaldo
  }
  return calcularDistanciaKm(lat1, lng1, lat2, lng2)
}
