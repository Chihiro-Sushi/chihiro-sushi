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

// Calcula distancia real por carretera usando Google Maps Distance Matrix API.
// Lanza un error si no se puede obtener la distancia.
export async function calcularDistanciaRuta(
  _lat1: number,
  _lng1: number,
  lat2: number,
  lng2: number
): Promise<number> {
  const res = await fetch(`/api/distancia?lat=${lat2}&lng=${lng2}`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error('No se pudo calcular la distancia por carretera')
  const data = await res.json()
  if (data.distanciaKm != null) return data.distanciaKm
  throw new Error('No se pudo calcular la distancia por carretera')
}
