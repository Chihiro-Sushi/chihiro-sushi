import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { enviarNotificacionPedido } from '@/lib/notificaciones'
import { FieldValue } from 'firebase-admin/firestore'
import type { Pedido } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const configSnap = await adminDb.collection('configuracion').doc('sitio').get()
    if (configSnap.exists && configSnap.data()?.suspensionDelivery) {
      return NextResponse.json(
        { error: 'Delivery suspendido temporalmente por condiciones climáticas.' },
        { status: 503 }
      )
    }

    const body = await req.json()

    const counterRef = adminDb.collection('counters').doc('pedidos')
    const numeroPedido: number = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef)
      const siguiente: number = snap.exists ? (snap.data()?.siguiente ?? 1) : 1
      tx.set(counterRef, { siguiente: siguiente + 1 }, { merge: true })
      return siguiente
    })

    const pedidoData = {
      ...body,
      numeroPedido,
      estado: 'pendiente',
      creadoEn: FieldValue.serverTimestamp(),
      actualizadoEn: FieldValue.serverTimestamp(),
    }

    const ref = await adminDb.collection('pedidos').add(pedidoData)
    const snap = await ref.get()
    const pedido = { id: ref.id, ...snap.data() } as Pedido

    // Enviar notificación al encargado
    try {
      await enviarNotificacionPedido(pedido)
      console.log('[Notificación] Email enviado correctamente')
    } catch (err) {
      console.error('[Notificación] Error al enviar email:', err)
    }

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (error) {
    console.error('[Pedidos] Error:', error)
    return NextResponse.json({ error: 'Error al procesar el pedido' }, { status: 500 })
  }
}
