/**
 * Script para poblar Firestore con el menú completo de Chihiro Sushi.
 * Uso: npx ts-node scripts/seed.ts
 * Requiere FIREBASE_ADMIN_* en .env.local
 * NOTA: Borra y re-crea todos los menu_items antes de insertar.
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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

// ─── Categorías ───────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: 'entradas',         nombre: 'Entradas',           orden: 1,  icono: '🥢', activa: true },
  { id: 'sopas',            nombre: 'Sopas',               orden: 2,  icono: '🍜', activa: true },
  { id: 'plancha',          nombre: 'A la Plancha',        orden: 3,  icono: '🍳', activa: true },
  { id: 'especialidades',   nombre: 'Especialidades',      orden: 4,  icono: '⭐', activa: true },
  { id: 'rollos_frios',     nombre: 'Rollos Fríos',        orden: 5,  icono: '🍱', activa: true },
  { id: 'rollos_calientes', nombre: 'Rollos Calientes',    orden: 6,  icono: '🔥', activa: true },
  { id: 'arma_tu_rollo',   nombre: 'Arma Tu Rollo',       orden: 7,  icono: '🎨', activa: true },
  { id: 'infantil',         nombre: 'Menú Infantil',       orden: 8,  icono: '🧒', activa: true },
  { id: 'bebidas',          nombre: 'Bebidas',             orden: 9,  icono: '🥤', activa: true },
]

// Variante que se agrega a todos los rollos sin empanizado en PF
const EMPANIZA = { nombre: 'Empanizar', precioExtra: 10 }
const SIN_EMPANIZAR = { nombre: 'Sin empanizar', precioExtra: 0 }
const VARIANTE_EMPANIZA = [SIN_EMPANIZAR, EMPANIZA]

// ─── Items ────────────────────────────────────────────────────────────────────
const ITEMS = [
  // ── ENTRADAS ──────────────────────────────────────────────────────────────
  { categoriaId: 'entradas', nombre: 'Edamames', descripcion: 'Vainas de frijol de soya (200 gr)', precio: 90, disponible: true, orden: 1 },
  { categoriaId: 'entradas', nombre: 'Esferas Haku', descripcion: 'Esferas de arroz empanizadas, rellenas de Philadelphia o Tampico (2 piezas)', precio: 90, disponible: true, orden: 2, variantes: [{ nombre: 'Philadelphia', precioExtra: 0 }, { nombre: 'Tampico', precioExtra: 0 }] },
  { categoriaId: 'entradas', nombre: 'Kushiages — Manchego', descripcion: 'Banderillas empanizadas con panko (2 piezas)', precio: 80, disponible: true, orden: 3 },
  { categoriaId: 'entradas', nombre: 'Kushiages — Camarón-Philadelphia', descripcion: 'Banderillas empanizadas con panko (2 piezas)', precio: 85, disponible: true, orden: 4 },
  { categoriaId: 'entradas', nombre: 'Kushiages — Plátano-Manchego', descripcion: 'Banderillas empanizadas con panko (2 piezas)', precio: 70, disponible: true, orden: 5 },
  { categoriaId: 'entradas', nombre: 'Temaki', descripcion: 'Cono de alga nori, relleno de arroz, pepino, aguacate y proteína a elección', precio: 90, disponible: true, orden: 6, variantes: [{ nombre: 'Atún', precioExtra: 0 }, { nombre: 'Salmón', precioExtra: 0 }, { nombre: 'Camarón', precioExtra: 0 }, { nombre: 'Kanikama', precioExtra: 0 }, { nombre: 'Anguila', precioExtra: 15 }] },
  { categoriaId: 'entradas', nombre: 'Nigiri', descripcion: 'Proteína sobre arroz (2 piezas)', precio: 55, disponible: true, orden: 7, variantes: [{ nombre: 'Atún', precioExtra: 0 }, { nombre: 'Salmón', precioExtra: 0 }, { nombre: 'Anguila', precioExtra: 10 }] },
  { categoriaId: 'entradas', nombre: 'Gyosas', descripcion: 'Dumplings al vapor rellenos con deliciosa carne de res preparada (6 piezas)', precio: 130, disponible: true, orden: 8 },

  // ── SOPAS ─────────────────────────────────────────────────────────────────
  { categoriaId: 'sopas', nombre: 'Ramen de la Casa', descripcion: 'Fideos de harina, cebollín, champiñón, germen de soya, naruto, huevo cocido y preparado de la casa', precio: 180, disponible: true, orden: 1, variantes: [{ nombre: 'Res', precioExtra: 0 }, { nombre: 'Camarón', precioExtra: 0 }, { nombre: 'Cerdo', precioExtra: 0 }] },
  { categoriaId: 'sopas', nombre: 'Skin Salmon Soup', descripcion: 'Sopa de la casa con salmón, camarón, cayo de hacha, piel de salmón frita, cebollín y arroz', precio: 150, disponible: true, orden: 2 },
  { categoriaId: 'sopas', nombre: 'Harusamen Soup', descripcion: 'Fideos Harusamen, kanikama, wakame, cebollín, aguacate y camarones', precio: 170, disponible: true, orden: 3 },
  { categoriaId: 'sopas', nombre: 'Miso Shiro', descripcion: 'Fideos Harusame, tofu y wakame', precio: 100, disponible: true, orden: 4 },
  { categoriaId: 'sopas', nombre: 'Ramen Soup', descripcion: 'Sopa japonesa con fideos sazonada con especias y verduras', precio: 130, disponible: true, orden: 5, variantes: [{ nombre: 'Pollo', precioExtra: 0 }, { nombre: 'Camarón', precioExtra: 10 }] },

  // ── A LA PLANCHA ──────────────────────────────────────────────────────────
  { categoriaId: 'plancha', nombre: 'Yakimeshi', descripcion: 'Arroz frito a la plancha con verduras, salsa de soya y cebollín (450 gr)', precio: 130, disponible: true, orden: 1, variantes: [{ nombre: 'Vegetariano', precioExtra: 0 }, { nombre: 'Camarón', precioExtra: 20 }, { nombre: 'Pollo', precioExtra: 20 }, { nombre: 'Sirloin', precioExtra: 20 }, { nombre: 'Mixto', precioExtra: 30 }, { nombre: 'Especial', precioExtra: 40 }] },
  { categoriaId: 'plancha', nombre: 'Teriyaki', descripcion: 'Cortes a la plancha sazonados con teriyaki, arroz al vapor y verduras a la mantequilla (400 gr)', precio: 170, disponible: true, orden: 2, variantes: [{ nombre: 'Pollo', precioExtra: 0 }, { nombre: 'Salmón', precioExtra: 70 }] },
  { categoriaId: 'plancha', nombre: 'Tepanyaki', descripcion: 'Verduras mixtas y germen de soya a la plancha, sazonado con salsa de soya (470 gr)', precio: 170, disponible: true, orden: 3, variantes: [{ nombre: 'Pollo', precioExtra: 0 }, { nombre: 'Camarón', precioExtra: 10 }, { nombre: 'Mixto', precioExtra: 30 }] },
  { categoriaId: 'plancha', nombre: 'Yakisoba', descripcion: 'Pasta japonesa con verduras bañadas en tonkatsu (450 gr)', precio: 135, disponible: true, orden: 4, variantes: [{ nombre: 'Verduras', precioExtra: 0 }, { nombre: 'Sirloin', precioExtra: 15 }, { nombre: 'Camarón', precioExtra: 15 }, { nombre: 'Pollo', precioExtra: 15 }, { nombre: 'Mixto', precioExtra: 25 }] },

  // ── ESPECIALIDADES ────────────────────────────────────────────────────────
  { categoriaId: 'especialidades', nombre: 'Tostadas Chihiro', descripcion: '3 tostadas con aguacate, Philadelphia, aderezo spicy, cebollín y sriracha. Atún, salmón / mixtos', precio: 120, disponible: true, orden: 1, variantes: [{ nombre: 'Atún', precioExtra: 0 }, { nombre: 'Salmón', precioExtra: 0 }, { nombre: 'Mixtos', precioExtra: 0 }] },
  { categoriaId: 'especialidades', nombre: 'Salmón Horneado', descripcion: 'Salmón relleno de Tampico, acompañado con salsa teriyaki y ajonjolí, montado sobre arroz blanco', precio: 240, disponible: true, orden: 2 },
  { categoriaId: 'especialidades', nombre: 'Hawaiian Bowl', descripcion: 'Arroz, pepino, aguacate, Tampico, mango, chipotle y ajonjolí (400 gr)', precio: 175, disponible: true, orden: 3, variantes: [{ nombre: 'Salmón', precioExtra: 0 }, { nombre: 'Atún', precioExtra: 0 }] },
  { categoriaId: 'especialidades', nombre: 'Poke Bowl', descripcion: 'Arroz, pepino, zanahoria, edamames, surimi, mango, aderezo spicy y ajonjolí (400 gr)', precio: 160, disponible: true, orden: 4, variantes: [{ nombre: 'Salmón', precioExtra: 0 }, { nombre: 'Atún', precioExtra: 0 }] },
  { categoriaId: 'especialidades', nombre: 'Tartar de Atún', descripcion: 'Aguacate, mango, pepino, aderezo chipotle, salsa de la casa, atún y tostadas', precio: 180, disponible: true, orden: 5 },
  { categoriaId: 'especialidades', nombre: 'Caribeña', descripcion: 'Finos cortes de salmón y atún, mango, aguacate, masago, soya y aceite de ajonjolí', precio: 230, disponible: true, orden: 6 },
  { categoriaId: 'especialidades', nombre: 'Geishas', descripcion: 'Aguacate, Philadelphia y chispas tempura envuelto en salmón fresco, salsa dulce, sriracha y furikake de camarón (6 piezas)', precio: 120, disponible: true, orden: 7 },
  { categoriaId: 'especialidades', nombre: 'Torikatsu', descripcion: 'Pechuga de pollo empanizada con panko, salsa teriyaki, ensalada y arroz Gohan', precio: 160, disponible: true, orden: 8 },

  // ── ROLLOS FRÍOS ──────────────────────────────────────────────────────────
  // Todos reciben variante "Sin empanizar / Empanizar +$10"
  { categoriaId: 'rollos_frios', nombre: 'Philadelphia Especial', descripcion: 'PD: Salmón, Philadelphia\nPF: Masago', precio: 160, disponible: true, orden: 1, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Arcoiris Roll', descripcion: 'PD: Ensalada Tampico, pepino, aguacate\nPF: Salmón, atún y camarón', precio: 170, disponible: true, orden: 2, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Aguachile Roll', descripcion: 'PD: Philadelphia, aguacate, pepino\nPF: Salmón, camarones al aguachile, cebolla morada y cilantro', precio: 185, disponible: true, orden: 3, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'California Roll', descripcion: 'PD: Pepino, camarón, aguacate\nPF: Ajonjolí', precio: 160, disponible: true, orden: 4, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Rocky Roll', descripcion: 'PD: Ensalada Tampico, pepino, aguacate, camarones tempura\nPF: Masago y salsa de anguila', precio: 160, disponible: true, orden: 5, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Salmón Roll', descripcion: 'PD: Salmón, pepino, aguacate, cebollín\nPF: Arroz', precio: 160, disponible: true, orden: 6, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Coco-Nut Roll', descripcion: 'PD: Camarón al coco, Philadelphia, aguacate\nPF: Coco tostado y salsa de coco', precio: 160, disponible: true, orden: 7, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Dragon Roll', descripcion: 'PD: Cangrejo, pepino, aguacate\nPF: Anguila rostizada, salsa dulce y Tampico', precio: 215, disponible: true, orden: 8, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Salmonado Roll', descripcion: 'PD: Pepino, Philadelphia, aguacate\nPF: Capa de salmón', precio: 165, disponible: true, orden: 9, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'California Especial', descripcion: 'PD: Camarón, aguacate, pepino\nPF: Masago', precio: 155, disponible: true, orden: 10, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Chilly Spicy', descripcion: 'PD: Habanero, Philadelphia, camarón, aguacate\nPF: Pepino y Togarashi', precio: 160, disponible: true, orden: 11, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Arashi Maki', descripcion: 'PD: Camarón empanizado, Tampico, aguacate\nPF: Philadelphia, kanikama y furikake de camarón', precio: 165, disponible: true, orden: 12, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Monkey Maki', descripcion: 'PD: Aguacate, pepino, Philadelphia\nPF: Plátano frito con salsa de anguila', precio: 145, disponible: true, orden: 13, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Crispy Tuna Roll', descripcion: 'PD: Atún, aguacate, chispas tempura\nPF: Capas de atún, salsa spicy, chispas tempura y Togarashi', precio: 160, disponible: true, orden: 14, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Ebi Tuna Roll', descripcion: 'PD: Camarón empanizado, pepino, aguacate\nPF: Atún sellado y salsa spicy', precio: 165, disponible: true, orden: 15, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Mango Roll', descripcion: 'PD: Pepino, aguacate, camarón\nPF: Capas de mango', precio: 160, disponible: true, orden: 16, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Sempai Maki', descripcion: 'PD: Philadelphia, aguacate, salmón, atún, surimi\nPF: Envuelto en alga', precio: 215, disponible: true, orden: 17, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Avocado Roll', descripcion: 'PD: Philadelphia, Tampico, camarón\nPF: Aguacate y ajonjolí', precio: 160, disponible: true, orden: 18, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Beef Roll', descripcion: 'PD: Res, chiles toreados, aguacate\nPF: Queso manchego', precio: 160, disponible: true, orden: 19, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Unagui Maki', descripcion: 'PD: Philadelphia, aguacate, camarón tempura\nPF: Anguila y ajonjolí', precio: 155, disponible: true, orden: 20, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Ebi Alaska Roll', descripcion: 'PD: Pepino, camarón, Philadelphia\nPF: Surimi', precio: 155, disponible: true, orden: 21, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Ebi Furai Roll', descripcion: 'PD: Camarón empanizado, aguacate, Philadelphia\nPF: Furikake de camarón y salsa de anguila', precio: 160, disponible: true, orden: 22, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Tsurai Salmón Roll', descripcion: 'PD: Philadelphia, salmón\nPF: Mitad aguacate, mitad pepino con salad spicy', precio: 155, disponible: true, orden: 23, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_frios', nombre: 'Philadelphia Roll', descripcion: 'PD: Philadelphia, salmón\nPF: Arroz y ajonjolí', precio: 145, disponible: true, orden: 24, variantes: VARIANTE_EMPANIZA },

  // ── ROLLOS CALIENTES ──────────────────────────────────────────────────────
  // Los que ya llevan "Empanizado" en PF NO reciben la variante
  { categoriaId: 'rollos_calientes', nombre: 'Tokio Roll', descripcion: 'PD: Camarón empanizado, Philadelphia, aguacate\nPF: Empanizado, Tampico, camarones roca, cebollín y aderezo spicy', precio: 215, disponible: true, orden: 1 },
  { categoriaId: 'rollos_calientes', nombre: 'Tempura Roll', descripcion: 'PD: Pollo, manchego, aguacate\nPF: Tempura', precio: 165, disponible: true, orden: 2, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_calientes', nombre: 'Empanizado Roll', descripcion: 'PD: Camarón, Philadelphia, aguacate\nPF: Empanizado', precio: 160, disponible: true, orden: 3 },
  { categoriaId: 'rollos_calientes', nombre: 'Especial Gratin Cheese', descripcion: 'PD: Camarón, Philadelphia\nPF: Empanizado y queso manchego gratinado', precio: 170, disponible: true, orden: 4 },
  { categoriaId: 'rollos_calientes', nombre: 'Kamaji Roll', descripcion: 'PD: Camarón, salmón, aguacate, queso manchego\nPF: Empanizado y ensalada Tampico', precio: 160, disponible: true, orden: 5 },
  { categoriaId: 'rollos_calientes', nombre: 'Mar y Tierra', descripcion: 'PD: Res, camarón, aguacate, toque de picante\nPF: Empanizado, cebolla y morrón caramelizado, queso manchego', precio: 155, disponible: true, orden: 6 },
  { categoriaId: 'rollos_calientes', nombre: 'Tocino Roll', descripcion: 'PD: Res, aguacate, cilantro\nPF: Empanizado, manchego gratinado y tocino', precio: 175, disponible: true, orden: 7 },
  { categoriaId: 'rollos_calientes', nombre: 'Manchego Especial', descripcion: 'PD: Aguacate, manchego, cebollín + res / pollo\nPF: Empanizado', precio: 160, disponible: true, orden: 8, variantes: [{ nombre: 'Res', precioExtra: 0 }, { nombre: 'Pollo', precioExtra: 0 }] },
  { categoriaId: 'rollos_calientes', nombre: 'Kani Tempura', descripcion: 'PD: Kanikama, Philadelphia, aguacate\nPF: Capeado y ensalada Tampico', precio: 165, disponible: true, orden: 9, variantes: VARIANTE_EMPANIZA },
  { categoriaId: 'rollos_calientes', nombre: 'Especial Crab Salad', descripcion: 'PD: Camarón, Philadelphia\nPF: Empanizado y ensalada Tampico', precio: 165, disponible: true, orden: 10 },

  // ── ARMA TU ROLLO ─────────────────────────────────────────────────────────
  { categoriaId: 'arma_tu_rollo', nombre: 'Arma Tu Rollo', descripcion: 'Elige 3 complementos y 2 proteínas. Complementos: Aguacate, Pepino, Manchego, Poro, Philadelphia, Mango, Plátano frito, Zanahoria, Calabaza, Champiñón, Tofu, Pimiento verde, Empanizado. Proteínas: Salmón, Atún, Pollo, Res, Surimi, Camarón, Pulpo, Kanikama.', precio: 170, disponible: true, orden: 1 },

  // ── MENÚ INFANTIL ─────────────────────────────────────────────────────────
  { categoriaId: 'infantil', nombre: 'Chicken Roll', descripcion: 'PD: Pollo y Philadelphia | PF: Empanizado (10 piezas)', precio: 130, disponible: true, orden: 1 },
  { categoriaId: 'infantil', nombre: 'Tiras de Pollo', descripcion: 'Acompañadas de salsa cátsup en recipiente aparte (120 gr)', precio: 125, disponible: true, orden: 2 },
  { categoriaId: 'infantil', nombre: 'Combo Kids', descripcion: 'Incluye 1 Kushiage de manchego + 1 bebida Mogu Mogu. Elige tu platillo principal:', precio: 110, disponible: true, orden: 3, variantes: [{ nombre: '5 pzas Chicken Roll', precioExtra: 0 }, { nombre: '½ Orden Tiras de Pollo', precioExtra: 0 }] },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  { categoriaId: 'bebidas', nombre: 'Coca-Cola', descripcion: '355 ml', precio: 40, disponible: true, orden: 1 },
  { categoriaId: 'bebidas', nombre: 'Sprite', descripcion: '355 ml', precio: 40, disponible: true, orden: 2 },
  { categoriaId: 'bebidas', nombre: 'Sidral Mundet', descripcion: '355 ml', precio: 40, disponible: true, orden: 3 },
  { categoriaId: 'bebidas', nombre: 'Arizona', descripcion: '460 ml', precio: 40, disponible: true, orden: 4 },
  { categoriaId: 'bebidas', nombre: 'Agua embotellada', descripcion: '', precio: 35, disponible: true, orden: 5 },
  { categoriaId: 'bebidas', nombre: 'Horchata', descripcion: '16 oz', precio: 45, disponible: true, orden: 6 },
  { categoriaId: 'bebidas', nombre: 'Jamaica', descripcion: '16 oz', precio: 45, disponible: true, orden: 7 },
  { categoriaId: 'bebidas', nombre: 'Maracuyá', descripcion: '16 oz', precio: 45, disponible: true, orden: 8 },
  { categoriaId: 'bebidas', nombre: 'Naranjada / Limonada Natural', descripcion: '16 oz', precio: 45, disponible: true, orden: 9, variantes: [{ nombre: 'Naranjada', precioExtra: 0 }, { nombre: 'Limonada', precioExtra: 0 }] },
  { categoriaId: 'bebidas', nombre: 'Naranjada / Limonada Mineral', descripcion: '16 oz', precio: 50, disponible: true, orden: 10, variantes: [{ nombre: 'Naranjada', precioExtra: 0 }, { nombre: 'Limonada', precioExtra: 0 }] },
  { categoriaId: 'bebidas', nombre: 'Calpis Natural', descripcion: '16 oz', precio: 50, disponible: true, orden: 11 },
  { categoriaId: 'bebidas', nombre: 'Conga', descripcion: '16 oz', precio: 45, disponible: true, orden: 12 },
]

async function seed() {
  console.log('🌱 Iniciando reseed de Chihiro Sushi...\n')

  // Limpiar menu_items existentes para evitar duplicados
  console.log('🗑️  Limpiando platillos existentes...')
  const snap = await db.collection('menu_items').get()
  if (snap.size > 0) {
    const delBatch = db.batch()
    snap.docs.forEach((doc) => delBatch.delete(doc.ref))
    await delBatch.commit()
    console.log(`   ${snap.size} platillos eliminados\n`)
  }

  const batch = db.batch()

  // Categorías (set por ID, idempotente)
  for (const cat of CATEGORIAS) {
    const ref = db.collection('menu_categorias').doc(cat.id)
    batch.set(ref, cat)
  }
  console.log(`✅ ${CATEGORIAS.length} categorías preparadas`)

  // Items (auto-ID)
  for (const item of ITEMS) {
    const ref = db.collection('menu_items').doc()
    batch.set(ref, item)
  }
  console.log(`✅ ${ITEMS.length} platillos preparados`)

  // Configuración del sitio
  const configRef = db.collection('configuracion').doc('sitio')
  batch.set(configRef, {
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
  })
  console.log('✅ Configuración del sitio preparada')

  await batch.commit()
  console.log('\n🎉 Reseed completado exitosamente.')
  process.exit(0)
}

seed().catch((err) => { console.error('❌ Error en seed:', err); process.exit(1) })
