import { NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function GET() {
  const db = getAdminDb()
  const [catsSnap, itemsSnap] = await Promise.all([
    db.collection('menu_categorias').orderBy('orden').get(),
    db.collection('menu_items').orderBy('orden').get(),
  ])
  const categorias = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return Response.json({ categorias, items })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getAdminDb()
  const ref = await db.collection('menu_items').add(body)
  return Response.json({ id: ref.id })
}
