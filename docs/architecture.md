# docs/architecture.md — Arquitectura del Sistema

> Actualizado: 2026-06-15
> Proyecto: Chihiro Sushi Web App

---

## 1. Visión general

La aplicación es un monorepo Next.js 16 (App Router) que corre en un único servidor. Las rutas públicas (`/`, `/checkout`, `/pedido-confirmado`) sirven a clientes que hacen pedidos. Las rutas de administración (`/admin/*`) son accesibles solo con sesión de Firebase Auth. Las API Routes actúan como backend BFF (Backend For Frontend) hacia Firebase, Stripe y Resend.

```
Browser (Cliente)
    │
    ├─── GET /                     → page.tsx (Server Component → Client Components)
    ├─── GET /checkout             → checkout/page.tsx
    ├─── GET /pedido-confirmado    → pedido-confirmado/page.tsx
    ├─── GET /admin/*              → admin layouts + pages
    │
    ├─── POST /api/pedidos         ─┐
    ├─── GET  /api/envio           ─┤── API Routes (Node.js server)
    ├─── POST /api/stripe/checkout ─┤       │
    └─── POST /api/stripe/webhook  ─┘       │
                                            │
                    ┌───────────────────────┼────────────────────┐
                    ▼                       ▼                    ▼
              Firebase                  Stripe API           Resend API
          (Firestore + Auth)        (Checkout Sessions)   (Email notif.)
              │
              ├── Client SDK (browser)  → onSnapshot, signIn
              └── Admin SDK (server)    → adminDb.collection().add/update
```

---

## 2. Módulos y sus relaciones

### 2.1 Árbol de dependencias (simplificado)

```
layout.tsx
  └── CarritoProvider (CarritoContext.tsx)
        └── page.tsx
              ├── useMenu.ts
              │     └── firebase.ts (onSnapshot → menu_categorias, menu_items)
              ├── CategoriaNav.tsx
              ├── ItemCard.tsx
              │     └── CarritoContext (dispatch AGREGAR)
              ├── CarritoDrawer.tsx
              │     └── CarritoContext (state, dispatch QUITAR/ELIMINAR/LIMPIAR)
              └── Navbar.tsx
                    └── CarritoContext (state.items.length)

checkout/page.tsx
  ├── CarritoContext (state para calcular total)
  ├── MapaPicker.tsx
  │     ├── window.google.maps (carga dinámica)
  │     └── envio.ts (calcularDistanciaKm)
  ├── POST /api/envio → envio.ts (calcularCostoEnvio)
  ├── POST /api/pedidos → firebase-admin.ts, notificaciones.ts
  └── POST /api/stripe/checkout → firebase-admin.ts, stripe.ts

admin/layout.tsx
  └── firebase.ts (onAuthStateChanged)

admin/dashboard/page.tsx
  └── usePedidosRealtime.ts
        └── firebase.ts (onSnapshot → pedidos)

admin/dashboard/menu/page.tsx
  └── firebase.ts (getDocs, addDoc, updateDoc, deleteDoc → menu_*)

admin/dashboard/promociones/page.tsx
  └── firebase.ts (CRUD → promociones)

admin/dashboard/configuracion/page.tsx
  └── firebase.ts (getDoc, setDoc → configuracion/sitio)
```

### 2.2 Flujo de datos — Menú en tiempo real

```
Firebase Console / seed.ts
    │ escribe
    ▼
Firestore: menu_categorias, menu_items
    │ onSnapshot (streaming)
    ▼
useMenu.ts (hook)
    │ estado: { categorias[], items[], cargando }
    ▼
page.tsx (Home)
    │ renderiza
    ▼
CategoriaNav + ItemCard (grid del menú)
```

### 2.3 Flujo de datos — Pedido efectivo

```
ItemCard → dispatch(AGREGAR)
    ▼
CarritoContext (estado en memoria + localStorage)
    ▼
checkout/page.tsx lee state.items
    ▼
POST /api/pedidos
    ├── adminDb.collection('pedidos').add(body)  [Firestore]
    └── enviarNotificacionPedido()               [Resend]
          └── resend.emails.send(html)
```

### 2.4 Flujo de datos — Pedido con tarjeta (Stripe)

```
checkout/page.tsx
    ▼
POST /api/stripe/checkout
    ├── 1. adminDb.collection('pedidos').add(body)  ← ANTES del pago
    └── 2. stripe.checkout.sessions.create()
              │
              ▼ (redirect)
    Stripe (hosted checkout)
              │ (pago exitoso)
              ▼ (redirect)
    /pedido-confirmado?pedidoId=X     ← BUG: carrito no se limpia
              │
              ▼ (async, Stripe → servidor)
    POST /api/stripe/webhook
        ├── stripe.webhooks.constructEvent()  [verifica firma]
        ├── adminDb.doc(pedidoId).update({ estado:'pendiente' })  ← BUG
        └── enviarNotificacionPedido()
```

### 2.5 Flujo de datos — Dashboard admin

```
onAuthStateChanged(auth)
    │ (con sesión)
    ▼
admin/dashboard/page.tsx
    ▼
usePedidosRealtime(filtroEstado?)
    ▼
Firestore: query(collection('pedidos'), where('estado','==',filtro), orderBy('creadoEn','desc'))
    │ onSnapshot (streaming)
    ▼
PedidoCard[] (lista en tiempo real)
    │ onChange(nuevoEstado)
    ▼
updateDoc(pedidoRef, { estado: nuevoEstado })
    │ (Firestore emite evento)
    ▼
Todos los listeners onSnapshot reciben el cambio
```

---

## 3. Estructura de Firestore

### Colección `menu_categorias`
```
{
  id: string (auto),
  nombre: string,        // "Rollos Especiales"
  orden: number,         // 1, 2, 3...
  activa: boolean,
  icono?: string
}
```

### Colección `menu_items`
```
{
  id: string (auto),
  categoriaId: string,   // referencia a menu_categorias
  nombre: string,
  descripcion: string,
  precio: number,        // en pesos MXN
  variantes?: [{ nombre: string, precioExtra: number }],
  imagenUrl?: string,    // URL de Firebase Storage (no implementado)
  disponible: boolean,
  orden: number,
  etiquetas?: string[]   // ["picante", "vegetariano"]
}
```

### Colección `pedidos`
```
{
  id: string (auto),
  cliente: {
    nombre: string,
    telefono: string,
    direccion: string,
    coordenadas: { lat: number, lng: number }
  },
  items: [{
    itemId: string,
    nombre: string,
    variante?: string,
    cantidad: number,
    precioUnitario: number,
    subtotal: number
  }],
  subtotal: number,
  costoEnvio: number,
  descuento: number,     // siempre 0 (promociones no implementadas)
  total: number,
  metodoPago: 'efectivo' | 'tarjeta',
  estado: 'pendiente' | 'en_proceso' | 'en_camino' | 'entregado' | 'cancelado',
  stripePaymentId?: string,
  notas?: string,
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```

Índice compuesto requerido (crear en Firebase Console):
- Colección: `pedidos`
- Campos: `estado ASC` + `creadoEn DESC`

### Colección `promociones`
```
{
  id: string (auto),
  nombre: string,
  descripcion: string,
  tipo: '3x2' | 'porcentaje' | 'fijo',
  valor?: number,
  categoriaIds?: string[],
  itemIds?: string[],
  activa: boolean,
  fechaInicio?: Timestamp,
  fechaFin?: Timestamp
}
```

### Documento `configuracion/sitio` (singleton)
```
{
  nombreRestaurante: string,
  slogan: string,
  telefono: string,
  horario: string,
  imagenPortada: string,
  imagenesGaleria: string[],
  textoDestacado: string,
  redesSociales: {
    facebook?: string,
    instagram?: string,
    whatsapp?: string
  },
  tarifaEnvioBase: number,    // MXN
  tarifaPorKm: number,        // MXN por km
  kmMaximoEnvio: number       // km máximo de cobertura
}
```

---

## 4. Patrones de implementación

### Patrón: Firebase Admin con Proxy lazy
Evita errores de build cuando las variables de entorno de Admin no están disponibles en tiempo de compilación.

```
// src/lib/firebase-admin.ts
let cachedDb: Firestore | null = null

function getAdminDb(): Firestore {
  if (cachedDb) return cachedDb
  // Valida env vars solo cuando se llama por primera vez
  cachedDb = getFirestore(initializeApp({ credential: cert({...}) }))
  return cachedDb
}

// Proxy: cada acceso a adminDb.collection() llama getAdminDb() internamente
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as unknown as Record<string|symbol, unknown>)[prop]
  }
})
```

### Patrón: CarritoContext con reducer
Estado del carrito centralizado, sincronizado con localStorage.

```
// Clave de ítem: "itemId__variante" o "itemId" si no tiene variante
// Esto permite tener el mismo platillo con distintas variantes como ítems separados

// CarritoContext exporta:
// - estado: { items: ItemCarrito[], total: number }
// - agregar(item: MenuItem, variante?: string): void
// - quitar(itemId: string, variante?: string): void
// - eliminar(itemId: string, variante?: string): void
// - limpiar(): void
```

### Patrón: onSnapshot con cleanup
Los hooks de Firestore devuelven la función de limpieza del listener en el `useEffect`:

```
useEffect(() => {
  const unsub = onSnapshot(query(...), (snap) => { ... })
  return () => unsub()  // cleanup al desmontar
}, [])
```

### Patrón: Google Maps carga dinámica
`MapaPicker.tsx` inyecta el script manualmente para evitar incompatibilidades de tipos con el loader oficial:

```
const script = document.createElement('script')
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
script.onload = () => initMapa()
document.head.appendChild(script)

// Uso directo de window.google.maps.* (tipado vía @types/google.maps)
const mapa = new window.google.maps.Map(mapRef.current, { ... })
const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, { ... })
```

### Patrón: Stripe Checkout Session con pedido pre-creado
El pedido se crea en Firestore antes de redirigir a Stripe para tener un ID disponible en la `success_url`. El webhook luego actualiza el mismo documento.

```
// /api/stripe/checkout/route.ts
const docRef = await adminDb.collection('pedidos').add({ ...body, estado: 'pendiente' })
const session = await stripe.checkout.sessions.create({
  metadata: { pedidoId: docRef.id },
  success_url: `${BASE_URL}/pedido-confirmado?pedidoId=${docRef.id}`,
  ...
})
return NextResponse.json({ url: session.url })
```

### Patrón: API Route de webhook con body crudo
El webhook de Stripe requiere el body sin parsear para verificar la firma HMAC:

```
// /api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text()          // texto crudo, NO req.json()
  const sig = req.headers.get('stripe-signature')!
  const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  ...
}
```

---

## 5. Restricciones y decisiones de diseño no obvias

### Por qué no hay `middleware.ts`
La protección de rutas admin se hace en el cliente con `onAuthStateChanged`. Agregar un middleware Next.js requeriría verificar el token de Firebase en el edge (con `firebase-admin` o la REST API de Firebase Auth), lo cual agrega complejidad. Como las Firestore Security Rules protegen los datos, se aceptó esta limitación temporalmente.

### Por qué Stripe no usa el SDK del cliente (`@stripe/stripe-js`)
El flujo implementado es una redirección a Stripe Hosted Checkout. El SDK del cliente (`@stripe/stripe-js`) es para Stripe Elements (formulario embebido). `@stripe/stripe-js` está instalado pero es una dependencia muerta — puede eliminarse.

### Por qué los colores tienen tres fuentes de verdad
Tailwind v4 usa `@theme` en CSS como configuración canónica. El `tailwind.config.ts` es un residuo de la generación inicial del proyecto. Los inline `style={{}}` se usan cuando los valores son dinámicos o cuando el autor no confió en que la clase Tailwind funcionaría. Esto es técnica incompleta — idealmente se eliminaría `tailwind.config.ts` y se usarían solo clases.

### Por qué `@googlemaps/js-api-loader` está instalado pero no se usa
El paquete fue instalado durante el desarrollo inicial. Se reemplazó por carga manual de script para resolver errores de TypeScript con los tipos del loader en el contexto de React 19 + Next.js 16. El paquete puede eliminarse.

### Por qué el seed usa `dotenv` en lugar de variables de entorno del sistema
`scripts/seed.ts` se ejecuta con `tsx` (fuera del entorno Next.js), por lo que no tiene acceso automático al sistema de variables de entorno de Next.js. `dotenv` carga `.env.local` manualmente.
