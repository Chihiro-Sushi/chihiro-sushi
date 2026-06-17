export const RESTAURANTE_COORDS = {
  lat: 20.6601733,
  lng: -87.0755267,
}

// Tarifario por tramos (MXN). Máximo 13 km; fuera de zona retorna null.
const TRAMOS: { maxKm: number; costo: number }[] = [
  { maxKm: 3,  costo: 40 },
  { maxKm: 5,  costo: 50 },
  { maxKm: 7,  costo: 60 },
  { maxKm: 9,  costo: 70 },
  { maxKm: 11, costo: 80 },
  { maxKm: 13, costo: 95 },
]

export const KM_MAXIMO_ENVIO = 13

// Retorna el costo de envío según el tramo correspondiente,
// o null si la distancia supera el área de cobertura.
export function calcularCostoEnvio(distanciaKm: number): number | null {
  const tramo = TRAMOS.find((t) => distanciaKm <= t.maxKm)
  return tramo ? tramo.costo : null
}

// Calcula distancia en km entre dos coordenadas usando la fórmula de Haversine.
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
