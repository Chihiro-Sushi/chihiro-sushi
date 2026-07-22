import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { horaActualNegocio } from '@/lib/horario'

export async function POST(req: NextRequest) {
  try {
    const hora = horaActualNegocio()
    if (hora < 14) {
      return NextResponse.json(
        { error: 'El servicio no está disponible entre las 12:00 am y las 2:00 pm.' },
        { status: 503 }
      )
    }

    const configSnap = await adminDb.collection('configuracion').doc('sitio').get()
    if (configSnap.exists && configSnap.data()?.suspensionDelivery) {
      return NextResponse.json(
        { error: 'Los pedidos no están disponibles por el momento.' },
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

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (error) {
    console.error('[Pedidos] Error:', error)
    return NextResponse.json({ error: 'Error al procesar el pedido' }, { status: 500 })
  }
}
