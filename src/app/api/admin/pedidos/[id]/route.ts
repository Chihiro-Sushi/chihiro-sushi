import { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { estado } = await req.json()
  const db = getAdminDb()
  await db.collection('pedidos').doc(id).update({
    estado,
    actualizadoEn: FieldValue.serverTimestamp(),
  })
  return Response.json({ ok: true })
}
