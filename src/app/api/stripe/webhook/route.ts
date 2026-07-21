import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[Stripe Webhook] Firma inválida:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { pedidoId?: string }; payment_intent?: string }
    const pedidoId = session.metadata?.pedidoId

    if (pedidoId) {
      const pedidoRef = adminDb.collection('pedidos').doc(pedidoId)
      const counterRef = adminDb.collection('counters').doc('pedidos')

      await adminDb.runTransaction(async (tx) => {
        const pedidoSnap = await tx.get(pedidoRef)
        // Idempotente: si ya se procesó este pago (reintento de webhook), no volver a asignar número
        if (!pedidoSnap.exists || pedidoSnap.data()?.estado !== 'esperando_pago') return

        const counterSnap = await tx.get(counterRef)
        const siguiente: number = counterSnap.exists ? (counterSnap.data()?.siguiente ?? 1) : 1
        tx.set(counterRef, { siguiente: siguiente + 1 }, { merge: true })

        tx.update(pedidoRef, {
          numeroPedido: siguiente,
          estado: 'pendiente',
          stripePaymentId: session.payment_intent ?? '',
          actualizadoEn: FieldValue.serverTimestamp(),
        })
      })
    }
  }

  return NextResponse.json({ received: true })
}
