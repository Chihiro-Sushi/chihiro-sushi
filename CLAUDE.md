# CLAUDE.md — Chihiro Sushi Web App

> Documento de contexto para sesiones de desarrollo con Claude Code.
> Actualizado: 2026-06-15 | Estado: En desarrollo activo (no listo para producción)

---

## 1. Objetivo general del sistema

Aplicación web de pedidos a domicilio para **Chihiro Sushi**, restaurante de cocina japonesa fusión ubicado en Playa del Carmen, Quintana Roo, México. Opera exclusivamente en modalidad delivery (no hay pedidos en sitio ni para recoger).

El sistema tiene tres actores:
- **Cliente**: navega el menú, arma un pedido, paga (efectivo o tarjeta) y recibe confirmación.
- **Encargado**: recibe notificación por email de cada pedido nuevo y gestiona el estado desde el dashboard.
- **Administrador**: gestiona el menú, promociones y configuración del sitio desde un panel protegido.

**Todo el contenido visible está en español.**

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 16 (App Router)            │
│                                                      │
│  ┌─────────────────┐    ┌────────────────────────┐  │
│  │  Rutas públicas  │    │  Panel Admin (/admin)  │  │
│  │  / (home+menú)   │    │  Protegido con         │  │
│  │  /checkout       │    │  Firebase Auth         │  │
│  │  /pedido-conf.   │    │  (client-side)         │  │
│  └────────┬─────────┘    └───────────┬────────────┘  │
│           │                          │                │
│  ┌────────▼──────────────────────────▼────────────┐  │
│  │              API Routes (server)                │  │
│  │  /api/pedidos  /api/envio  /api/stripe/*        │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Firestore        Stripe API      Resend API
   (datos + RT)   (pagos sandbox)  (email notif.)
```

**Patrón de datos**: Firestore como única fuente de verdad. Los listeners `onSnapshot` proporcionan tiempo real tanto al cliente (menú) como al admin (pedidos).

**Separación cliente/servidor**:
- Firebase Client SDK → componentes y hooks (browser)
- Firebase Admin SDK → API Routes únicamente (server)
- Stripe Secret Key → API Routes únicamente (server)
- Resend API Key → API Routes únicamente (server)

---

## 3. Stack tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework | Next.js | 16.2.9 | SSR, routing, API Routes |
| UI | React | 19.2.4 | Componentes |
| Lenguaje | TypeScript | ^5 | Tipado estático |
| Estilos | Tailwind CSS | ^4 | Utilidades CSS |
| Base de datos | Firebase Firestore | ^12.14.0 | Datos + tiempo real |
| Almacenamiento | Firebase Storage | (incluido en firebase) | Imágenes (preparado, no implementado en UI) |
| Autenticación | Firebase Auth | (incluido en firebase) | Login de admin |
| Admin SDK | firebase-admin | ^14.0.0 | Escritura server-side |
| Pagos | Stripe | ^22.2.1 | Checkout Sessions (redirección) |
| Notificaciones | Resend | ^6.12.4 | Email al encargado |
| Mapas | Google Maps API | (carga dinámica) | Autocomplete + distancia Haversine |
| Iconos | lucide-react | ^1.18.0 | Íconos UI |

---

## 4. Estructura de carpetas

```
chihiro-sushi/
├── public/
│   └── images/                  # 10 fotos profesionales del restaurante
│       ├── 31012026-_DSC2438.jpg
│       ├── 31012026-_DSC2550.jpg  (no usada en la UI actual)
│       ├── 31012026-_DSC2581.jpg
│       ├── 01022026-_DSC2616.jpg
│       ├── 01022026-_DSC2637.jpg
│       ├── 01022026-_DSC2652.jpg
│       ├── 04032026-_DSC4637.jpg  (no usada en la UI actual)
│       ├── 04032026-_DSC4775.jpg
│       ├── 04032026-_DSC4809.jpg
│       └── 04032026-_DSC4848.jpg  (no usada en la UI actual)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout — monta CarritoProvider
│   │   ├── page.tsx               # Home pública (hero + menú + galería)
│   │   ├── globals.css            # Estilos globales + @theme Tailwind v4
│   │   ├── checkout/
│   │   │   └── page.tsx           # Formulario de pedido + mapa + pago
│   │   ├── pedido-confirmado/
│   │   │   └── page.tsx           # Pantalla post-pedido
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Layout admin — guard de auth client-side
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login con Firebase Auth
│   │   │   └── dashboard/
│   │   │       ├── page.tsx       # Pedidos en tiempo real
│   │   │       ├── menu/
│   │   │       │   └── page.tsx   # CRUD de platillos
│   │   │       ├── promociones/
│   │   │       │   └── page.tsx   # CRUD de promociones
│   │   │       └── configuracion/
│   │   │           └── page.tsx   # Configuración del sitio
│   │   └── api/
│   │       ├── pedidos/
│   │       │   └── route.ts       # POST — crear pedido + notificar
│   │       ├── envio/
│   │       │   └── route.ts       # GET — calcular costo por distanciaKm
│   │       └── stripe/
│   │           ├── checkout/
│   │           │   └── route.ts   # POST — crear Stripe Checkout Session
│   │           └── webhook/
│   │               └── route.ts   # POST — webhook de confirmación de pago
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Barra superior fija con contador de carrito
│   │   │   └── Footer.tsx         # Pie de página con contacto y redes
│   │   ├── menu/
│   │   │   ├── ItemCard.tsx       # Tarjeta de platillo con selector de variantes
│   │   │   ├── CategoriaNav.tsx   # Tabs horizontales de categorías
│   │   │   └── CarritoDrawer.tsx  # Panel lateral del carrito
│   │   ├── checkout/
│   │   │   └── MapaPicker.tsx     # Mapa + autocomplete de dirección
│   │   └── admin/
│   │       └── PedidoCard.tsx     # Tarjeta de pedido con cambio de estado
│   │
│   ├── context/
│   │   └── CarritoContext.tsx     # Estado global del carrito (reducer + localStorage)
│   │
│   ├── hooks/
│   │   ├── useMenu.ts             # Firestore listener para menú en tiempo real
│   │   └── usePedidosRealtime.ts  # Firestore listener para pedidos con filtro
│   │
│   ├── lib/
│   │   ├── firebase.ts            # Firebase Client SDK (auth, db, storage)
│   │   ├── firebase-admin.ts      # Firebase Admin SDK con proxy lazy
│   │   ├── stripe.ts              # Instancia de Stripe server-side
│   │   ├── envio.ts               # Haversine + calcularCostoEnvio()
│   │   └── notificaciones.ts      # enviarNotificacionPedido() con Resend
│   │
│   └── types/
│       └── index.ts               # Interfaces globales TypeScript
│
├── scripts/
│   └── seed.ts                    # Pobla Firestore con menú completo (9 cats, ~68 ítems)
│
├── docs/
│   ├── project-status.md
│   └── architecture.md
│
├── .env.local.example             # Plantilla de variables de entorno
├── next.config.ts
├── tailwind.config.ts
└── CLAUDE.md                      # Este archivo
```

---

## 5. Funcionalidad de cada módulo

### `src/app/page.tsx` — Home pública
- Hero a pantalla completa con imagen estática (`04032026-_DSC4775.jpg`)
- Banner de promoción 3×2 hardcoded
- Galería de 3 imágenes
- Menú completo organizado por categorías (datos desde Firestore en tiempo real)
- Navegación sticky entre categorías con scroll suave
- Galería secundaria de 4 imágenes
- **PENDIENTE**: slogan, banner y horario hardcoded; no lee `configuracion/sitio`
- **BUG**: `setCategoriaActiva` llamado directamente en el render (no en `useEffect`)

### `src/app/checkout/page.tsx` — Checkout
- Formulario: nombre, teléfono
- MapaPicker: selección de dirección + cálculo de distancia
- Cálculo de envío vía `/api/envio`
- Selección de método de pago (efectivo / tarjeta)
- Campo de notas opcionales
- Resumen del pedido con total
- Flujo efectivo: POST a `/api/pedidos` → redirige a `/pedido-confirmado`
- Flujo tarjeta: POST a `/api/stripe/checkout` → redirige a URL de Stripe
- **BUG**: carrito no se limpia tras pago exitoso con tarjeta

### `src/context/CarritoContext.tsx` — Estado del carrito
- Reducer con acciones: AGREGAR, QUITAR, ELIMINAR, LIMPIAR, CARGAR
- La clave de cada ítem es `itemId__variante` para distinguir variantes del mismo platillo
- Persiste en `localStorage` (clave: `chihiro_carrito`)
- **BUG**: al presionar `+` en CarritoDrawer, se crea un `fakeItem` con `variantes:[]`, ignorando `precioExtra`

### `src/lib/envio.ts` — Módulo de costo de envío
- `calcularCostoEnvio(distanciaKm, tarifaBase?, tarifaPorKm?)`: `base + ceil(km) * tarifaPorKm`
- Coordenadas del restaurante hardcoded: `{ lat: 20.6601733, lng: -87.0755267 }`
- `calcularDistanciaKm()` usa fórmula de Haversine
- **PENDIENTE**: la API `/api/envio` no pasa tarifas desde Firestore; usa defaults hardcoded

### `src/lib/notificaciones.ts` — Notificaciones
- Usa Resend para enviar email HTML al encargado
- Email destinatario: `NOTIFICACION_EMAIL` env var (fallback a `davidtejeda662@gmail.com`)
- Remitente: `NOTIFICACION_FROM` env var (fallback a `onboarding@resend.dev`, solo sandbox)
- **PENDIENTE**: HTML sin escapado → posible XSS en email si el nombre contiene etiquetas HTML

### `src/app/api/pedidos/route.ts` — API de pedidos
- Recibe body y lo escribe directamente en Firestore con spread `...body`
- Agrega `estado: 'pendiente'` y timestamps del servidor
- Llama `enviarNotificacionPedido()` sin bloquear (fire-and-forget)
- **BUG CRÍTICO**: sin validación de input; acepta campos arbitrarios en Firestore

### `src/app/api/stripe/checkout/route.ts` — Stripe checkout
- Crea el pedido en Firestore **antes** de crear la sesión Stripe
- Si Stripe falla, el pedido queda en Firestore sin `stripePaymentId` (pedido fantasma)
- `success_url`: `/pedido-confirmado?pedidoId={id}`
- `cancel_url`: `/checkout`

### `src/app/api/stripe/webhook/route.ts` — Webhook Stripe
- Verifica firma con `stripe.webhooks.constructEvent()`
- En `checkout.session.completed`: actualiza estado del pedido a `'pendiente'` (igual que al crear)
- **BUG**: el estado no cambia; debería actualizarse a `'en_proceso'`

### `src/app/admin/layout.tsx` — Layout admin
- `onAuthStateChanged` redirige a `/admin/login` si no hay sesión activa
- Sidebar con 4 secciones: Pedidos, Menú, Promociones, Configuración
- **LIMITACIÓN**: protección solo client-side; no hay `middleware.ts` server-side

### `src/app/admin/dashboard/promociones/page.tsx` — Promociones
- CRUD completo en Firestore (tipos: `3x2`, `porcentaje`, `fijo`)
- **PENDIENTE CRÍTICO**: las promociones no se aplican en checkout; `descuento` siempre es 0

---

## 6. Dependencias críticas

```
firebase@^12          — Firestore en tiempo real, Auth, Storage
firebase-admin@^14    — Escritura server-side en API Routes
stripe@^22            — Procesamiento de pagos (Checkout Sessions)
resend@^6             — Email transaccional al encargado
lucide-react@^1.18    — Íconos en toda la UI
```

### Dependencias a corregir
```
@stripe/stripe-js@^9  — INSTALADA PERO NO USADA (eliminar)
@types/google.maps     — En dependencies; mover a devDependencies
dotenv@^17            — En dependencies; mover a devDependencies (solo scripts/seed.ts)
```

---

## 7. Variables de entorno requeridas

| Variable | Scope | Descripción |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | public | URL base del sitio (ej: `http://localhost:3000`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | public | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | public | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | public | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | public | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | public | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | public | Firebase App ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | public | Google Maps (Maps JS + Places API) |
| `FIREBASE_ADMIN_PROJECT_ID` | server | Firebase Admin Project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | server | Firebase Admin Service Account Email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | server | Firebase Admin Private Key (con `\n` escapados) |
| `STRIPE_SECRET_KEY` | server | Stripe Secret Key (`sk_test_...` en sandbox) |
| `STRIPE_WEBHOOK_SECRET` | server | Stripe Webhook Signing Secret (`whsec_...`) |
| `RESEND_API_KEY` | server | Resend API Key (`re_...`) |
| `NOTIFICACION_EMAIL` | server | Email del encargado para notificaciones |
| `NOTIFICACION_FROM` | server | Email remitente (requiere dominio verificado en Resend en producción) |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está declarada en `.env.local.example` pero no se usa en el código (relacionada con la dependencia `@stripe/stripe-js` que tampoco se usa).

---

## 8. Decisiones técnicas

### Stripe Checkout Sessions (redirección)
El pago con tarjeta redirige al usuario a la página de Stripe. Razón: cumplimiento PCI automático y menor complejidad. Contrapartida: el usuario sale del sitio durante el pago.

### Firebase Admin con Proxy lazy
`firebase-admin.ts` exporta `adminDb` como un `Proxy` que inicializa el SDK en el primer acceso en lugar de al importar el módulo. Esto evita que `next build` falle al no tener credenciales en tiempo de compilación.

### CarritoContext con Reducer sin librerías externas
React Context + `useReducer` para mantener el bundle pequeño. Persistencia con `localStorage` directamente en los efectos del Provider.

### Google Maps sin `@googlemaps/js-api-loader`
`MapaPicker.tsx` carga Google Maps con un `<script>` dinámico en el DOM en lugar del loader del paquete. Esto resolvió incompatibilidades de tipos con Next.js 16 / React 19. El paquete `@googlemaps/js-api-loader` quedó instalado residualmente.

### Autenticación admin solo client-side
Verificación con `onAuthStateChanged` en el layout. No hay `middleware.ts`. Las Firestore Security Rules son la última línea de defensa real.

### Tailwind v4 con configuración dual (CONFLICTO ACTIVO)
La configuración canónica para Tailwind v4 va en `globals.css` con `@theme`. Sin embargo, `tailwind.config.ts` también define los mismos colores en `theme.extend`. Hay tres fuentes de verdad para los colores: `globals.css`, `tailwind.config.ts` e inline `style={{}}`.

---

## 9. Convenciones de código

### Nomenclatura
- **Componentes React**: PascalCase (`ItemCard`, `CarritoDrawer`)
- **Hooks**: camelCase con prefijo `use` (`useMenu`, `usePedidosRealtime`)
- **Funciones utilitarias**: camelCase (`calcularCostoEnvio`, `calcularDistanciaKm`)
- **API Routes**: `route.ts` en cada carpeta de la ruta

### Idioma
- Nombres de variables de dominio de negocio en español: `categoriaActiva`, `calcularCostoEnvio`
- Nombres técnicos del ecosistema en inglés: `useEffect`, `onSnapshot`, `handler`
- Todos los textos visibles al usuario en español

### Estilos
- Tailwind utility classes con tokens del tema como primera opción
- Tokens de color definidos en `globals.css @theme` (canónico para Tailwind v4)
- Inline `style={{}}` para valores dinámicos o casos que Tailwind no cubre

---

## 10. Flujo de pedidos

### Flujo efectivo
```
Cliente agrega ítems → /checkout
→ Nombre + teléfono + dirección (MapaPicker)
→ GET /api/envio?distanciaKm=X → costo de envío
→ "Efectivo" → POST /api/pedidos
  → Firestore: {estado: 'pendiente'}
  → Resend: email al encargado [fire-and-forget]
→ /pedido-confirmado + limpiar()
```

### Flujo tarjeta (Stripe)
```
→ "Tarjeta" → POST /api/stripe/checkout
  → Firestore: {estado: 'pendiente'} ← ANTES del pago
  → Stripe: crea Checkout Session
  → Redirige a URL de Stripe
→ Usuario paga en Stripe
→ Stripe → /pedido-confirmado?pedidoId=X
  ← BUG: carrito NO se limpia aquí
→ Stripe POST /api/stripe/webhook
  → Verifica firma
  → Firestore: {estado: 'pendiente'} ← BUG: mismo estado
  → Resend: email al encargado
```

### Gestión en dashboard admin
```
/admin/dashboard → usePedidosRealtime → onSnapshot('pedidos')
→ Pedidos en tiempo real sin recargar
→ PedidoCard: cambiar estado (pendiente → en_proceso → en_camino → entregado)
  → updateDoc en Firestore → visible en tiempo real para todos los tabs admin
```

---

## 11. Flujo de autenticación

```
/admin/* → AdminLayout.onAuthStateChanged
  → Sin sesión → redirect /admin/login
  → Con sesión → renderiza contenido

/admin/login: signInWithEmailAndPassword → /admin/dashboard
Cerrar sesión: signOut → /admin/login
```

La protección es 100% client-side. Las Firestore Security Rules son la única barrera server-side real (deben configurarse en Firebase Console).

---

## 12. Flujo de pagos

```
POST /api/stripe/checkout
← { cliente, items, subtotal, costoEnvio, total, metodoPago, notas }
→ adminDb.collection('pedidos').add({...body, estado:'pendiente'})
→ stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [...items, envío],
    success_url: '/pedido-confirmado?pedidoId={id}',
    cancel_url: '/checkout',
    metadata: { pedidoId },
    payment_method_types: ['card'],
    locale: 'es',
  })
→ retorna { url: session.url }

POST /api/stripe/webhook
← Header: stripe-signature
← Body: texto crudo (req.text())
→ stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
→ checkout.session.completed:
  → adminDb.doc(pedidoId).update({ estado:'pendiente', stripePaymentId })
  ← BUG: debería ser 'en_proceso' o 'pagado'
  → enviarNotificacionPedido(pedido)
```

Modo actual: Sandbox. Claves `sk_test_*`.

---

## 13. Integraciones externas

### Firestore — Colecciones
| Colección | Descripción |
|---|---|
| `menu_categorias` | 9 categorías con `orden` y `activa` |
| `menu_items` | ~68 platillos con precio, variantes, `disponible`, `categoriaId` |
| `pedidos` | Pedidos con estado, cliente, ítems, totales, `stripePaymentId?` |
| `promociones` | CRUD de promociones (no aplicadas en checkout) |
| `configuracion/sitio` | Documento singleton con config del restaurante |

Índice compuesto requerido en `pedidos`: `estado ASC + creadoEn DESC` — crear en Firebase Console.

### Google Maps
- APIs necesarias: Maps JavaScript API, Places API
- Carga: `<script>` dinámico en `MapaPicker.tsx`
- Configurar restricción de dominio en Google Cloud Console

### Stripe
- Webhook endpoint: `/api/stripe/webhook`
- Evento: `checkout.session.completed`
- Prueba local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Resend
- Sandbox: remitente `onboarding@resend.dev`
- Producción: verificar dominio propio → actualizar `NOTIFICACION_FROM`

---

## 14. Problemas conocidos (bugs confirmados)

| ID | Severidad | Descripción | Archivo |
|---|---|---|---|
| B01 | CRÍTICO | `setCategoriaActiva` en cuerpo del render (no en `useEffect`) | `src/app/page.tsx` |
| B02 | CRÍTICO | Sin validación de body en `/api/pedidos` | `src/app/api/pedidos/route.ts` |
| B03 | CRÍTICO | Sin validación de body en `/api/stripe/checkout` | `src/app/api/stripe/checkout/route.ts` |
| B04 | CRÍTICO | Carrito no se limpia tras pago exitoso con tarjeta | `src/app/checkout/page.tsx` |
| B05 | ALTO | Webhook actualiza `estado` a `'pendiente'` (igual que el inicial) | `src/app/api/stripe/webhook/route.ts` |
| B06 | ALTO | Precio incorrecto al agregar unidades en CarritoDrawer (fakeItem sin variantes) | `src/components/menu/CarritoDrawer.tsx` |
| B07 | ALTO | `/api/envio` no lee tarifas de Firestore; usa defaults hardcoded | `src/app/api/envio/route.ts` |
| B08 | ALTO | Pedido creado antes de Stripe — si Stripe falla, queda pedido fantasma | `src/app/api/stripe/checkout/route.ts` |
| B09 | ALTO | Auth admin solo client-side; sin middleware Next.js | `src/app/admin/layout.tsx` |
| B10 | ALTO | `onSnapshot` en `useMenu` sin handler de error → spinner infinito | `src/hooks/useMenu.ts` |
| B11 | MEDIO | Home no lee `configuracion/sitio`; contenido hardcoded | `src/app/page.tsx` |
| B12 | MEDIO | Promociones CRUD ok pero no aplicadas en checkout | `src/app/checkout/page.tsx` |
| B13 | MEDIO | `/pedido-confirmado` accesible directamente sin pedido real | `src/app/pedido-confirmado/page.tsx` |
| B14 | MEDIO | Índice compuesto Firestore faltante para queries filtradas | Firebase Console |
| B15 | BAJO | Email hardcoded en `notificaciones.ts` y `.env.local.example` | Múltiples |
| B16 | BAJO | Texto "modo sandbox" visible al cliente en checkout | `src/app/checkout/page.tsx` |
| B17 | BAJO | HTML del email sin escapado (posible XSS en cliente de correo) | `src/lib/notificaciones.ts` |

---

## 15. Pendientes (funcionalidades diseñadas pero no implementadas)

1. **Aplicación de promociones**: 3x2, descuento % y descuento fijo no existen en código. Solo son datos en Firestore.
2. **Subida de imágenes desde admin**: el form de menú no tiene upload a Firebase Storage.
3. **Lectura de `configuracion/sitio` en la home**: el documento existe en Firestore pero `page.tsx` usa contenido hardcoded.
4. **Fallback de MapaPicker**: si la API Key falla, el usuario no puede completar el pedido.
5. **Middleware de auth server-side**: proteger rutas admin a nivel de Next.js middleware.
6. **Limpieza de pedidos huérfanos de Stripe**: pedidos creados antes de confirmar pago.
7. **Firestore Security Rules**: no configuradas; cualquiera puede leer/escribir.
8. **Índices compuestos en Firestore**: necesarios para el dashboard admin con filtros.

---

## 16. Próximos pasos recomendados

### Antes del primer usuario real (orden de prioridad)
1. Corregir B01, B02, B03, B04, B05, B06 (los 6 bugs más críticos)
2. Configurar Firestore Security Rules en Firebase Console
3. Crear usuario admin en Firebase Auth Console
4. Crear índice compuesto en Firestore: `pedidos — estado ASC + creadoEn DESC`
5. Ejecutar `npx tsx scripts/seed.ts` para poblar el menú
6. Probar webhook con `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Antes del lanzamiento público
7. Verificar dominio en Resend → actualizar `NOTIFICACION_FROM`
8. Conectar home a `configuracion/sitio`
9. Implementar lógica de aplicación de promociones en checkout
10. Implementar upload de imágenes en admin
11. Agregar middleware Next.js para proteger rutas admin a nivel servidor
12. Configurar restricción de dominio en Google Cloud Console para la Maps API Key

### Para producción
13. Cambiar claves Stripe de `sk_test_*` a `sk_live_*`
14. Actualizar `NEXT_PUBLIC_BASE_URL` al dominio real
15. Registrar webhook de Stripe con URL de producción
16. Deploy en Vercel (recomendado para Next.js App Router)
