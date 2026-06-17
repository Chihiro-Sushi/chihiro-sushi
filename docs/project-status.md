# docs/project-status.md — Estado del Proyecto

> Actualizado: 2026-06-15
> Proyecto: Chihiro Sushi Web App (pedidos a domicilio)

---

## Estado general

**NO listo para producción.**
La aplicación compila sin errores y es funcional en modo desarrollo, pero tiene bugs críticos que deben resolverse antes de recibir usuarios reales. El menú requiere ser sembrado en Firestore antes del primer uso.

---

## Funcionalidades implementadas

### Público (cliente)
- [x] Home con hero, galería de fotos y banner de promoción
- [x] Menú completo en tiempo real desde Firestore (categorías + platillos)
- [x] Navegación sticky entre categorías con scroll suave
- [x] Carrito lateral (drawer) con persistencia en localStorage
- [x] Selección de variantes de platillos (ej: tamaño, proteína)
- [x] Contador de ítems en la Navbar
- [x] Checkout con formulario (nombre, teléfono, notas)
- [x] Selección de dirección con Google Maps Autocomplete
- [x] Cálculo de costo de envío por distancia (Haversine)
- [x] Pago en efectivo
- [x] Pago con tarjeta vía Stripe Checkout Sessions (modo sandbox)
- [x] Pantalla de confirmación de pedido

### Notificaciones
- [x] Email al encargado por cada pedido (Resend)
- [x] Email con detalle completo: ítems, dirección, total, método de pago

### Panel admin
- [x] Login con Firebase Auth (email/password)
- [x] Guard de autenticación con redirect
- [x] Dashboard de pedidos en tiempo real (onSnapshot)
- [x] Filtro de pedidos por estado
- [x] Cambio de estado de pedido desde la tarjeta
- [x] CRUD de categorías del menú
- [x] CRUD de platillos del menú
- [x] CRUD de promociones (tipos: 3x2, porcentaje, fijo)
- [x] Formulario de configuración del sitio (Firestore)

### Backend / API
- [x] `/api/pedidos` — crear pedido + notificar
- [x] `/api/envio` — calcular costo de envío
- [x] `/api/stripe/checkout` — crear sesión de Stripe
- [x] `/api/stripe/webhook` — confirmar pago de Stripe
- [x] Firebase Admin SDK con inicialización lazy (Proxy)

### Infraestructura
- [x] Arquitectura Next.js App Router
- [x] TypeScript en todo el proyecto
- [x] Firebase Client SDK con singleton pattern
- [x] Firebase Admin SDK con lazy Proxy pattern
- [x] Script de seed del menú (`scripts/seed.ts`)
- [x] Variables de entorno documentadas (`.env.local.example`)
- [x] Imágenes del restaurante en `public/images/` (10 fotos)

---

## Funcionalidades pendientes

### Críticas (bloquean el lanzamiento)
- [ ] **Validación de body en APIs** — `/api/pedidos` y `/api/stripe/checkout` aceptan campos arbitrarios y los escriben directamente en Firestore
- [ ] **Limpieza de carrito tras pago con tarjeta** — `limpiar()` no se llama en el flujo de Stripe
- [ ] **Estado del webhook** — el webhook de Stripe actualiza el pedido a `'pendiente'` (igual que el estado inicial), sin diferenciación
- [ ] **Firestore Security Rules** — sin reglas configuradas, cualquier cliente puede leer y escribir
- [ ] **Índice compuesto en Firestore** — query `estado + creadoEn` en pedidos requiere índice manual en Firebase Console

### Importantes (afectan la experiencia del usuario)
- [ ] **Precio al agregar en CarritoDrawer** — el botón `+` recrea el ítem con `variantes:[]`, ignorando el `precioExtra`
- [ ] **Error en render de home** — `setCategoriaActiva` se llama directamente en el cuerpo del componente, no en `useEffect`
- [ ] **Home hardcoded** — slogan, banner de promoción, horario e imágenes de portada no se leen de `configuracion/sitio`
- [ ] **Aplicación de promociones** — el CRUD de promociones existe pero `descuento` siempre es 0 en checkout
- [ ] **Fallback de MapaPicker** — si Google Maps falla, el botón de submit queda bloqueado permanentemente
- [ ] **Pedidos huérfanos de Stripe** — si Stripe falla después de crear el pedido, queda un pedido sin `stripePaymentId`
- [ ] **Spinner infinito en useMenu** — si Firestore devuelve error, `setCargando(false)` nunca se llama

### Menores
- [ ] **Texto "modo sandbox"** — visible al cliente en la pantalla de checkout
- [ ] **HTML sin escapar en email** — el nombre y dirección del cliente se inyectan directamente en el HTML del email
- [ ] **`/pedido-confirmado`** accesible directamente sin pedido real
- [ ] **Middleware server-side para admin** — solo hay protección client-side con `onAuthStateChanged`
- [ ] **Subida de imágenes en admin** — `imagenUrl` existe en el tipo pero el formulario del admin no tiene campo de upload
- [ ] **Tarifas de envío desde Firestore** — `/api/envio` usa defaults hardcoded, no lee `configuracion/sitio`

---

## Riesgos técnicos

| Riesgo | Severidad | Descripción |
|---|---|---|
| Sin Firestore Security Rules | CRÍTICO | Cualquier usuario puede leer/escribir cualquier colección |
| Sin validación de input en APIs | CRÍTICO | Body spread directo en Firestore; campos arbitrarios aceptados |
| Auth admin solo client-side | ALTO | Las API Routes del admin no verifican identidad en servidor |
| Pedidos fantasma de Stripe | ALTO | Pedidos en Firestore sin confirmación de pago quedan activos |
| Google Maps API Key sin restricción de dominio | ALTO | La clave pública puede ser robada y usada desde otros dominios |
| HTML sin escapar en email | MEDIO | Si un atacante envía `<script>` como nombre, puede afectar el cliente de email del encargado |

---

## Completitud por módulo

| Módulo | Implementado | Funcional | Listo para prod |
|---|---|---|---|
| Home pública | 90% | Sí (con bugs menores) | No (hardcoded) |
| Menú en tiempo real | 100% | Sí | Sí* |
| Carrito | 90% | Sí (con bug de precio en drawer) | No |
| Checkout / Pago efectivo | 95% | Sí | No (sin validación) |
| Checkout / Stripe | 80% | Parcial (bugs de limpieza y webhook) | No |
| Notificaciones email | 95% | Sí | Casi (falta dominio Resend) |
| Dashboard admin | 90% | Sí | No (auth solo client-side) |
| CRUD menú admin | 85% | Sí (bug en campo `orden`) | No |
| CRUD promociones | 60% | CRUD funciona; no aplica en checkout | No |
| Configuración sitio | 50% | CRUD funciona; home no la consume | No |
| Script de seed | 100% | Sí | Sí |
| Variables de entorno | 100% | Documentadas | Sí |

*El menú en tiempo real es funcional pero requiere que el seed se haya ejecutado y que los índices estén creados.
