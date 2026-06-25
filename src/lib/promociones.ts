import type { ItemCarrito, Promocion } from '@/types'

function esVigente(promo: Promocion): boolean {
  const ahora = new Date()
  const ms = ahora.getTime()
  if (promo.fechaInicio && promo.fechaInicio.toMillis() > ms) return false
  if (promo.fechaFin && promo.fechaFin.toMillis() < ms) return false
  if (promo.diasSemana && promo.diasSemana.length > 0) {
    if (!promo.diasSemana.includes(ahora.getDay())) return false
  }
  return true
}

function itemCalifica(item: ItemCarrito, promo: Promocion): boolean {
  const tieneItems = promo.itemIds && promo.itemIds.length > 0
  const tieneCats = promo.categoriaIds && promo.categoriaIds.length > 0
  if (!tieneItems && !tieneCats) return true
  if (tieneItems && promo.itemIds!.includes(item.itemId)) return true
  if (tieneCats && item.categoriaId && promo.categoriaIds!.includes(item.categoriaId)) return true
  return false
}

export function clavesConPromocion3x2(items: ItemCarrito[], promociones: Promocion[]): Set<string> {
  const activas = promociones.filter((p) => p.activa && p.tipo === '3x2' && esVigente(p))
  const claves = new Set<string>()

  for (const promo of activas) {
    const calificados = items.filter((item) => itemCalifica(item, promo))
    const totalUnidades = calificados.reduce((s, item) => s + item.cantidad, 0)
    if (totalUnidades >= 3) {
      calificados.forEach((item) => {
        const clave = item.variante ? `${item.itemId}__${item.variante}` : item.itemId
        claves.add(clave)
      })
    }
  }

  return claves
}

export function calcularDescuento(items: ItemCarrito[], promociones: Promocion[]): number {
  const activas = promociones.filter((p) => p.activa && esVigente(p))
  let descuento = 0

  for (const promo of activas) {
    if (promo.tipo === '3x2') {
      // Recolectar todas las unidades calificadas con su precio unitario
      const unidades: number[] = []
      for (const item of items) {
        if (itemCalifica(item, promo)) {
          for (let i = 0; i < item.cantidad; i++) {
            unidades.push(item.precioUnitario)
          }
        }
      }
      // Ordenar de mayor a menor, cada 3ra unidad (la más barata del grupo) es gratis
      unidades.sort((a, b) => b - a)
      for (let i = 2; i < unidades.length; i += 3) {
        descuento += unidades[i]
      }
    } else if (promo.tipo === 'porcentaje' && promo.valor) {
      const base = items
        .filter((item) => itemCalifica(item, promo))
        .reduce((s, item) => s + item.subtotal, 0)
      descuento += base * (promo.valor / 100)
    } else if (promo.tipo === 'fijo' && promo.valor) {
      descuento += promo.valor
    }
  }

  return Math.round(descuento * 100) / 100
}
