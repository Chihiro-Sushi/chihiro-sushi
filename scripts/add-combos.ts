/**
 * Script aditivo: crea la categoría "Combos" y los 4 combos del menú.
 * A diferencia de seed.ts, este script NO borra nada — es seguro re-ejecutarlo.
 * Uso: npx tsx scripts/add-combos.ts
 * Requiere FIREBASE_ADMIN_* en .env.local
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
})
const db = getFirestore(app)

const CATEGORIA = { id: 'combos', nombre: 'Combos', orden: 0, icono: '🎁', activa: true }

const ITEMS = [
  {
    nombre: 'Combo 1',
    descripcion: 'Yakimeshi con pollo empanizado y tampico + 1 bebida a elegir',
    precio: 199,
    orden: 1,
  },
  {
    nombre: 'Combo 2',
    descripcion: '1 rollo a elegir (Ebi Furai Roll, Manchego Especial o Empanizado Roll) + 1/2 orden de yakimeshi vegetariano + 1 bebida a elegir',
    precio: 249,
    orden: 2,
  },
  {
    nombre: 'Combo 3',
    descripcion: '1 rollo a elegir (Mango Roll, Crispy Tuna Roll o California Roll) + 2 Kushiages de manchego + 1 bebida a elegir',
    precio: 249,
    orden: 3,
  },
  {
    nombre: 'Combo Pareja',
    descripcion: 'Yakimeshi (proteína a elegir: pollo, sirloin o camarón) + 2 Kushiages de manchego + 1 Chicken Roll + 2 bebidas a elegir',
    precio: 399,
    orden: 4,
  },
].map((item) => ({ ...item, categoriaId: 'combos', disponible: true }))

async function run() {
  console.log('🎁 Agregando categoría y combos...\n')

  await db.collection('menu_categorias').doc(CATEGORIA.id).set(CATEGORIA)
  console.log('✔ Categoría "combos" creada/actualizada (orden: 0)')

  const existentesSnap = await db.collection('menu_items').where('categoriaId', '==', 'combos').get()
  const nombresExistentes = new Set(existentesSnap.docs.map((d) => d.data().nombre))

  const batch = db.batch()
  let agregados = 0
  for (const item of ITEMS) {
    if (nombresExistentes.has(item.nombre)) {
      console.log(`↷ "${item.nombre}" ya existe, se omite`)
      continue
    }
    const ref = db.collection('menu_items').doc()
    batch.set(ref, item)
    agregados++
  }

  if (agregados > 0) {
    await batch.commit()
  }
  console.log(`\n✔ ${agregados} combo(s) nuevo(s) agregado(s). Listo.`)
}

run().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
