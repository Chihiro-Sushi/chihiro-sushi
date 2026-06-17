import { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getAdminDb()
  const ref = await db.collection('menu_items').add(body)
  return Response.json({ id: ref.id })
}
