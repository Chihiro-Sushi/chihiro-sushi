import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Guardar pedido en Firestore con estado temporal hasta confirmar pago
    const ref = await adminDb.collection('pedidos').add({
      ...body,
      estado: 'esperando_pago',
      creadoEn: FieldValue.serverTimestamp(),
      actualizadoEn: FieldValue.serverTimestamp(),
    })

    const lineItems = body.items.map((item: { nombre: string; variante?: string; cantidad: number; precioUnitario: number }) => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: item.variante ? `${item.nombre} (${item.variante})` : item.nombre,
        },
        unit_amount: Math.round(item.precioUnitario * 100),
      },
      quantity: item.cantidad,
    }))

    // Agregar envío como línea separada
    if (body.costoEnvio > 0) {
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: 'Costo de envío' },
          unit_amount: Math.round(body.costoEnvio * 100),
        },
        quantity: 1,
      })
    }

    // Agregar comisión por pago con tarjeta
    if (body.comisionTarjeta > 0) {
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: 'Cargo por pago con tarjeta' },
          unit_amount: Math.round(body.comisionTarjeta * 100),
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${BASE_URL}/pedido-confirmado?pedidoId=${ref.id}`,
      cancel_url: `${BASE_URL}/checkout`,
      metadata: { pedidoId: ref.id },
      payment_method_types: ['card'],
      locale: 'es',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
