import { unstable_cache } from 'next/cache'
import { getAdminDb } from '@/lib/firebase-admin'

const fetchMenu = unstable_cache(
  async () => {
    const db = getAdminDb()
    const [catsSnap, itemsSnap] = await Promise.all([
      db.collection('menu_categorias').orderBy('orden').get(),
      db.collection('menu_items').orderBy('orden').get(),
    ])
    const categorias = catsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => (c as { activa?: boolean }).activa !== false)
    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return { categorias, items }
  },
  ['menu'],
  { tags: ['menu'], revalidate: 300 }
)

export async function GET() {
  try {
    const data = await fetchMenu()
    return Response.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/menu]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
