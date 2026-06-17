import { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminDb()

  // Eliminar todos los pedidos en lotes de 500 (límite de Firestore)
  const snap = await db.collection('pedidos').get()
  let eliminados = 0

  if (!snap.empty) {
    const docs = snap.docs
    for (let i = 0; i < docs.length; i += 500) {
      const batch = db.batch()
      docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    eliminados = docs.length
  }

  // Resetear contador a 1
  await db.collection('counters').doc('pedidos').set({ siguiente: 1 })

  console.log(`[cron/reset-pedidos] Reset completado — ${eliminados} pedidos eliminados`)
  return Response.json({ ok: true, eliminados })
}
