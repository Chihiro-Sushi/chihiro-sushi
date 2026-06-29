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

export function getPromoParaItem(
  itemId: string,
  categoriaId: string | undefined,
  promociones: Promocion[]
): Promocion | null {
  const activas = promociones.filter((p) => p.activa && esVigente(p))
  for (const promo of activas) {
    const tieneItems = promo.itemIds && promo.itemIds.length > 0
    const tieneCats = promo.categoriaIds && promo.categoriaIds.length > 0
    if (!tieneItems && !tieneCats) return promo
    if (tieneItems && promo.itemIds!.includes(itemId)) return promo
    if (tieneCats && categoriaId && promo.categoriaIds!.includes(categoriaId)) return promo
  }
  return null
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

export interface DescuentoItem {
  descuento: number
  etiqueta: string
}

export function calcularDescuentoPorItem(
  items: ItemCarrito[],
  promociones: Promocion[]
): Map<string, DescuentoItem> {
  const resultado = new Map<string, DescuentoItem>()
  const activas = promociones.filter((p) => p.activa && esVigente(p))

  for (const promo of activas) {
    if (promo.tipo === '3x2') {
      const unidades: { clave: string; precio: number }[] = []
      for (const item of items) {
        if (itemCalifica(item, promo)) {
          const clave = item.variante ? `${item.itemId}__${item.variante}` : item.itemId
          for (let i = 0; i < item.cantidad; i++) {
            unidades.push({ clave, precio: item.precioUnitario })
          }
        }
      }
      unidades.sort((a, b) => b.precio - a.precio)
      for (let i = 2; i < unidades.length; i += 3) {
        const { clave, precio } = unidades[i]
        const prev = resultado.get(clave)
        resultado.set(clave, {
          descuento: Math.round(((prev?.descuento ?? 0) + precio) * 100) / 100,
          etiqueta: 'Promo 3×2 aplicada',
        })
      }
    } else if (promo.tipo === '2x1') {
      const unidades: { clave: string; precio: number }[] = []
      for (const item of items) {
        if (itemCalifica(item, promo)) {
          const clave = item.variante ? `${item.itemId}__${item.variante}` : item.itemId
          for (let i = 0; i < item.cantidad; i++) {
            unidades.push({ clave, precio: item.precioUnitario })
          }
        }
      }
      unidades.sort((a, b) => b.precio - a.precio)
      for (let i = 1; i < unidades.length; i += 2) {
        const { clave, precio } = unidades[i]
        const prev = resultado.get(clave)
        resultado.set(clave, {
          descuento: Math.round(((prev?.descuento ?? 0) + precio) * 100) / 100,
          etiqueta: 'Promo 2×1 aplicada',
        })
      }
    } else if (promo.tipo === 'porcentaje' && promo.valor) {
      for (const item of items) {
        if (itemCalifica(item, promo)) {
          const clave = item.variante ? `${item.itemId}__${item.variante}` : item.itemId
          const desc = Math.round(item.subtotal * (promo.valor / 100) * 100) / 100
          const prev = resultado.get(clave)
          resultado.set(clave, {
            descuento: (prev?.descuento ?? 0) + desc,
            etiqueta: `${promo.valor}% OFF aplicado`,
          })
        }
      }
    } else if (promo.tipo === 'fijo' && promo.valor) {
      for (const item of items) {
        if (itemCalifica(item, promo)) {
          const clave = item.variante ? `${item.itemId}__${item.variante}` : item.itemId
          const desc = Math.round(promo.valor * item.cantidad * 100) / 100
          const prev = resultado.get(clave)
          resultado.set(clave, {
            descuento: (prev?.descuento ?? 0) + desc,
            etiqueta: `-$${promo.valor} por unidad`,
          })
        }
      }
    }
  }

  return resultado
}

export function calcularDescuento(items: ItemCarrito[], promociones: Promocion[]): number {
  const activas = promociones.filter((p) => p.activa && esVigente(p))
  let descuento = 0

  for (const promo of activas) {
    if (promo.tipo === '3x2') {
      const unidades: number[] = []
      for (const item of items) {
        if (itemCalifica(item, promo)) {
          for (let i = 0; i < item.cantidad; i++) {
            unidades.push(item.precioUnitario)
          }
        }
      }
      unidades.sort((a, b) => b - a)
      for (let i = 2; i < unidades.length; i += 3) {
        descuento += unidades[i]
      }
    } else if (promo.tipo === '2x1') {
      const unidades: number[] = []
      for (const item of items) {
        if (itemCalifica(item, promo)) {
          for (let i = 0; i < item.cantidad; i++) {
            unidades.push(item.precioUnitario)
          }
        }
      }
      unidades.sort((a, b) => b - a)
      for (let i = 1; i < unidades.length; i += 2) {
        descuento += unidades[i]
      }
    } else if (promo.tipo === 'porcentaje' && promo.valor) {
      const base = items
        .filter((item) => itemCalifica(item, promo))
        .reduce((s, item) => s + item.subtotal, 0)
      descuento += base * (promo.valor / 100)
    } else if (promo.tipo === 'fijo' && promo.valor) {
      const totalUnidades = items
        .filter((item) => itemCalifica(item, promo))
        .reduce((s, item) => s + item.cantidad, 0)
      descuento += promo.valor * totalUnidades
    }
  }

  return Math.round(descuento * 100) / 100
}
