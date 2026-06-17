import { getAdminDb } from '@/lib/firebase-admin'

export async function GET() {
  const db = getAdminDb()
  const snap = await db.collection('pedidos').orderBy('creadoEn', 'desc').get()
  const pedidos = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      creadoEn: data.creadoEn?.toDate?.()?.toISOString() ?? null,
      actualizadoEn: data.actualizadoEn?.toDate?.()?.toISOString() ?? null,
    }
  })
  return Response.json(pedidos)
}
