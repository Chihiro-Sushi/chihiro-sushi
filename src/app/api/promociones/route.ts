import { getAdminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('promociones').where('activa', '==', true).get()
    const promociones = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json(promociones, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/promociones]', msg)
    return Response.json([], { status: 500 })
  }
}
