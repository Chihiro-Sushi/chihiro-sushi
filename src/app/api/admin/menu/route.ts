import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getAdminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const db = getAdminDb()
    const [catsSnap, itemsSnap] = await Promise.all([
      db.collection('menu_categorias').orderBy('orden').get(),
      db.collection('menu_items').orderBy('orden').get(),
    ])
    const categorias = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json({ categorias, items })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/admin/menu]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getAdminDb()
  const ref = await db.collection('menu_items').add(body)
  revalidateTag('menu', {})
  return Response.json({ id: ref.id })
}
