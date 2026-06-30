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
      await adminDb.collection('pedidos').doc(pedidoId).update({
        estado: 'en_proceso',
        stripePaymentId: session.payment_intent ?? '',
        actualizadoEn: FieldValue.serverTimestamp(),
      })
    }
  }

  return NextResponse.json({ received: true })
}
