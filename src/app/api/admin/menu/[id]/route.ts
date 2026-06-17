import { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const db = getAdminDb()
  await db.collection('menu_items').doc(id).update(body)
  return Response.json({ ok: true })
}
