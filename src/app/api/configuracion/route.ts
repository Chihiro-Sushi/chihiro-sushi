import { getAdminDb } from '@/lib/firebase-admin'

const CONFIG_DEFECTO = {
  nombreRestaurante: 'Chihiro Sushi',
  slogan: '¡Un viaje de sabor en cada bocado!',
  telefono: '(984) 313 9064',
  horario: 'Lun–Dom 13:00–23:00 hrs',
  imagenPortada: '',
  imagenesGaleria: [],
  textoDestacado: '🎉 3×2 todos los días — Sopas, Rollos, Yakimeshis, Pastas y Kushiages',
  redesSociales: { facebook: 'Chihiro Sushi', instagram: 'Sushi_Chihiro', whatsapp: '9843139064' },
  tarifaEnvioBase: 30,
  tarifaPorKm: 10,
  kmMaximoEnvio: 15,
}

export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('configuracion').doc('sitio').get()
    const data = snap.exists ? snap.data() : CONFIG_DEFECTO
    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/configuracion]', msg)
    return Response.json(CONFIG_DEFECTO)
  }
}
