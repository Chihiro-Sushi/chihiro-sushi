import { getAdminDb } from '@/lib/firebase-admin'

let cache: { data: unknown; at: number } | null = null
const TTL = 60_000 // 60 segundos

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < TTL) {
      return Response.json(cache.data)
    }
    const db = getAdminDb()
    const [catsSnap, itemsSnap] = await Promise.all([
      db.collection('menu_categorias').orderBy('orden').get(),
      db.collection('menu_items').orderBy('orden').get(),
    ])
    const categorias = catsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => (c as { activa?: boolean }).activa !== false)
    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    cache = { data: { categorias, items }, at: Date.now() }
    return Response.json(cache.data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/menu]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
