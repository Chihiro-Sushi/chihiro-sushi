import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getAdminDb } from '@/lib/firebase-admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const db = getAdminDb()
  await db.collection('menu_items').doc(id).update(body)
  revalidateTag('menu')
  return Response.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getAdminDb()
  await db.collection('menu_items').doc(id).delete()
  revalidateTag('menu')
  return Response.json({ ok: true })
}
