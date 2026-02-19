# ProDrones Hub V5 — Progress Tracker
> Última actualización: 2026-02-18 | Estado general: ~75% completado

## ✅ Completados esta sesión
- [x] Settings — Password change (`/api/auth/change-password`)
- [x] Socket.IO — Servidor custom + todos los handlers (viewers, admin, cron)
- [x] Share Link System (`/api/share` POST/DELETE/GET + `/api/share/validate/[token]` + `ShareModal`)
- [x] Batched Email Worker (`Delivery_Email_Outbox` + `Delivery_Email_Items` + server.ts cron 60s)
- [x] Organizations — Detalle + contactos management (add/remove/primary/archive) + formato `{user_id, primary}`

---

## PHASE 1 — FOUNDATION
> Objetivo: Base del sistema, auth, routing, configuración

- [x] Next.js 16 + TypeScript strict mode
- [x] Drizzle ORM configurado con MySQL
- [x] 19 schemas de base de datos definidos (Users, Jobs, Sites, Organizations, etc.)
- [x] Conexión a DB existente (`localhost:3309 → prodrones_application`)
- [x] Auth — Login con email/password (bcrypt cost 11)
- [x] Auth — Logout (limpieza de token en `Users.Tokens`)
- [x] Auth — 2FA via código de email (6 dígitos)
- [x] Auth — 2FA via TOTP (authenticator app)
- [x] Auth — Registro de usuario
- [x] Auth — Forgot password / Reset password
- [x] Auth — Session tokens en `Users.Tokens` JSON array
- [x] Auth — Cookie HTTP-only `pds_session` con AES-256-CBC
- [x] Auth — Token types: session (30d), two-factor-session (15d), verification (5min), register (4d), pass-reset (1d)
- [x] Middleware — Resolución de app via subdomain (`hub.*`, `client.*`, `admin.*`)
- [x] Middleware — Resolución de app via query param `?app=hub|client|admin`
- [x] Middleware — Redirect a login si no hay sesión
- [x] Routing — `/hub/*` para Staff, Pilot, Manager, Admin
- [x] Routing — `/client/*` para Clients
- [x] Routing — `/admin/*` para Admins únicamente
- [x] Routing — `/viewer/*` para viewers embebidos
- [x] Routing — `/auth/*` para páginas públicas
- [x] Navigation — Sidebar/Navbar generado desde tabla `Pages`
- [x] Navigation — Agrupación por `NavGroup`, hidden pages excluidas
- [x] Navigation — Ordenado por `Priority` ASC
- [x] Role-based access control (RBAC) — roles 0,1,3,4,5,6,7
- [x] Permission-based access control — 28 permisos granulares
- [x] Configuration loader desde tabla `Configuration`
- [x] Configuration — Cache de 6 horas
- [x] Configuration — Resolución: global (`*`) → app-specific override
- [x] Settings — **Password change funcional** *(endpoint `/api/auth/change-password` creado, settings page actualizada)*
- [x] Settings — Theme toggle (dark/light)
- [x] UI Components — Shadcn/RadixUI (25 componentes: button, input, dialog, table, etc.)
- [x] UI Components — Tabler Icons integrados
- [x] UI Components — Font Awesome integrado
- [x] Global error handler (`error.tsx`)
- [x] 404 page (`not-found.tsx`)

---

## PHASE 2 — CORE BUSINESS
> Objetivo: Gestión de jobs, sites, organizations, productos

### Jobs — Kanban Dashboard
- [x] KanbanBoard — 5 columnas por pipeline (Bids, Scheduled, Processing, Bill, Completed)
- [x] KanbanBoard — Filtros: por client, site, product, date range
- [x] KanbanBoard — Búsqueda de texto (job ID, site, client, producto)
- [x] KanbanBoard — Paginación (10, 25, 50 items por página)
- [x] KanbanBoard — Bulk selection (checkbox por job card)
- [x] KanbanBoard — Vista desktop (tabla) y mobile (cards)
- [x] KanbanBoard — Badge de conteo por pipeline
- [x] KanbanBoard — Auto-refresh cada 30 segundos
- [x] KanbanBoard — Exportar CSV

### Jobs — CRUD & Pipeline
- [x] Crear job nuevo (starts in `bids`)
- [x] Ver detalle de job (418 líneas, todos los metadatos)
- [x] Editar job (site, client, dates, description)
- [x] Eliminar job (con confirmación)
- [x] Pipeline — Approve flight (`approved_flight` en Job_Meta)
- [x] Pipeline — Schedule flight (`dates.scheduled`, `scheduled_flight`, `persons_assigned`)
- [x] Pipeline — Log flight (`dates.flown`, `dates.logged`, `flight_log`)
- [x] Pipeline — Mark delivered (`dates.delivered`)
- [x] Pipeline — Send invoice (`dates.billed`, `invoice_number`)
- [x] Pipeline — Mark paid (`dates.bill_paid`, `invoice_paid`)
- [x] `callUpdateJobPipeline()` llamado tras cada cambio de pipeline
- [x] Timeline view de todas las fechas importantes
- [x] Display de staff asignado
- [x] Display de información financiera (amount, invoice, payment)
- [x] Display de notas del job
- [ ] Upload/gestión de archivos adjuntos en job *(endpoints existen, UI no verificada)*
- [ ] Download de adjuntos (ZIP para múltiples) *(endpoint existe, UI no verificada)*

### Sites
- [x] Lista de sites con búsqueda
- [x] Vista lista y vista mapa (toggle)
- [x] Paginación con opciones de page size
- [x] Crear site con coordenadas y boundary GeoJSON
- [x] Validación de coordenadas (lat/lng)
- [x] Editar site
- [x] Mapa con Leaflet (SitesMap component)
- [x] Exportar CSV de sites
- [x] Check de permisos (`create_project_site`)
- [ ] Boundary drawing interactivo con Leaflet Draw *(mapa existe, confirmar drawing tools)*
- [ ] FAA LAANC — airspace ceiling al crear site *(opcional, no implementado)*

### Organizations
- [x] Lista de organizations con búsqueda
- [x] Conteo de contactos y jobs por organización
- [x] Crear organización
- [x] API GET/POST organizaciones
- [x] **Detalle de organización** — `/hub/onboard/company/manage/[id]` con info editable
- [x] Agregar contactos a organización — `POST /api/organizations/[id]/contacts`
- [x] Remover contactos de organización — `DELETE /api/organizations/[id]/contacts`
- [x] Set primary contact — `PATCH /api/organizations/[id]/contacts`
- [x] Archivar/Desarchivar organización — `POST/DELETE /api/organizations/[id]/archive`
- [x] Editar campos: address, streetAddress, city, state, zip, name
- [x] Contactos con formato `{user_id, primary}` + legacy `number[]` backward compat
- [ ] Bulk archive organizations *(sería operación masiva desde la lista)*
- [ ] Editar logo / domain / source / dates *(campos adicionales opcionales)*

### Products
- [x] Lista de product types en DB (23 productos)
- [x] 3 viewer products (Landscape id=1, Community id=2, Construct id=3)
- [ ] **Product deliverable forms** *(UI de formularios según `meta_defaults` no verificada)*
- [ ] Mostrar product deliverable cards en job detail

---

## PHASE 3 — ADVANCED FEATURES
> Objetivo: Bulk ops, recurring jobs, emails, share links

### Bulk Operations
- [x] Endpoint bulk approve (`/api/workflow/bulk/approve`)
- [x] Endpoint bulk flight-log (`/api/workflow/bulk/flight-log`)
- [x] Endpoint bulk deliver (`/api/workflow/bulk/deliver`)
- [x] Endpoint bulk bill (`/api/workflow/bulk/bill`)
- [x] Endpoint bulk delete (`/api/workflow/bulk/delete`)
- [ ] **BulkApproveScheduleModal** — UI para aprobar + schedule + asignar pilots en bulk
- [ ] **BulkFlightLogModal** — UI para ingresar flight log data en bulk
- [ ] **BulkDeliveryModal** — UI para marcar delivered + email en bulk
- [ ] BulkActionToolbar — aparece al seleccionar jobs *(selector existe en Kanban, toolbar pendiente)*

### Recurring Jobs
- [x] Schema `Recurring_Job_Templates` y `Recurring_Job_Occurrences`
- [x] Occurrence generator service
- [x] API list/get/create/update/delete templates
- [x] API preview-schedule (preview RRULE dates)
- [x] API generate-all (generar jobs desde templates activos)
- [x] API skip-occurrence
- [x] API add-to-bids (job desde template manual)
- [ ] **RecurringJobsList** — tabla de todos los templates *(page existe, UI no verificada en detalle)*
- [ ] **RecurringJobModal** — RRULE builder interactivo (frequency, interval, days, start/end, preview calendar)
- [ ] Cron job — generación automática de recurring jobs

### Email System
- [x] Provider: Nodemailer (Gmail OAuth2)
- [x] Provider: SendGrid
- [x] Provider: Resend
- [x] Provider: Ethereal (desarrollo)
- [x] Template engine
- [ ] **Template: pilot-new-job** *(cuando se schedule un job y se asigna pilot)*
- [ ] **Template: deliver-product** *(cuando se marca delivered)*
- [ ] **Template: register-account** *(nuevo usuario / contact onboarded)*
- [ ] **Template: password-change** *(admin cambia password)*
- [ ] **Template: reset-password** *(user solicita reset)*
- [ ] **Template: authentication** *(código 2FA por email)*
- [x] **Batched Email Worker** — procesa `Delivery_Email_Outbox` donde `status='pending'` y `send_after <= NOW()`
- [x] Worker — agrupa `Delivery_Email_Items` por `outbox_id`
- [x] Worker — envía email HTML consolidado con todos los items
- [x] Worker — actualiza status a `sent` o `failed`
- [x] Worker — registrado en `server.ts` con `setInterval` 60s (persistente)
- [x] Worker — corre al startup para procesar emails que se acumularon offline
- [x] Endpoint `POST /api/cron/delivery-emails` para trigger manual/externo

### Share Link System ❌ NO IMPLEMENTADO
- [ ] **POST `/api/share`** — Crear share link con expiry
- [ ] **DELETE `/api/share`** — Revocar share links
- [ ] **GET `/api/share/validate/[token]`** — Validar share token
- [x] **ShareModal component** — Generar/revocar share links con opciones de expiración
- [ ] Lógica en middleware para páginas shareables (`Shareable=1` en Pages)
- [x] Soporte para `requestToken` en Shares (parámetros del request)

---

## PHASE 4 — VIEWERS
> Objetivo: Tilesets, viewers de mapa, real-time, ArcGIS

### Tileset Management
- [x] Lista de tilesets (con búsqueda, published/draft badge)
- [x] Upload de tileset (con chunked upload via Dropzone protocol)
- [x] Crear tileset tras upload (`/api/tilesets` POST)
- [x] Servir tiles como static files (`/api/tiles/[...path]`)
- [ ] Paginación en lista de tilesets
- [ ] Editar tileset (nombre, descripción, opciones)
- [ ] Eliminar tileset
- [ ] Página "Create Tileset" (`/hub/tilesets/manage`)

### Landscape Viewer ✅
- [x] Mapa con Leaflet + MapLibre GL
- [x] Cargar tileset desde DB por ID
- [x] Drawing tools — crear/editar/eliminar polígonos (áreas)
- [x] Classification system con colores
- [x] Saved views (posiciones de cámara/zoom)
- [x] Layer toggles
- [x] Guardar/cargar deliverable data (features, classifications, views)
- [x] Error handling y loading states
- [ ] Parcel feature server (ArcGIS) integration
- [ ] Road annotation overlay

### Community Viewer ⚠️
- [x] Route y componente existen (`/viewer/community/[jobProductId]`)
- [ ] **Parcel-level compliance reports** *(funcionalidad core, no verificada)*
- [ ] **Property detail overlays**
- [ ] Classification system para propiedades
- [ ] AI dirty roof JSON import
- [ ] Source photo viewing
- [ ] ArcGIS parcel integration (FL: Collier, Sarasota, Manatee, Lee, Pasco, Charlotte — TX)

### Construct Viewer ⚠️
- [x] Route y componente existen (`/viewer/construct/[jobProductId]`)
- [ ] **Area polygons + classification** *(funcionalidad, no verificada)*
- [ ] Parcel integration

### Socket.IO — Real-Time ✅ IMPLEMENTADO
> Custom server en `server.ts`, handlers en `src/lib/socket/`

- [x] **Instalar y configurar Socket.IO 4 server** (`server.ts` custom server)
- [x] Auth — validar session cookie al conectar (`src/lib/socket/auth.ts`)
- [x] **Viewer — `product:join`** (join viewer room, actualiza `last_viewer_activity`)
- [x] **Viewer — `product:leave`** (leave room)
- [x] **Viewer — `product:users`** (lista de usuarios en room)
- [x] Landscape — `product:ls_viewer:areas:update`
- [x] Landscape — `product:ls_viewer:areas:delete`
- [x] Landscape — `product:ls_viewer:classes:update`
- [x] Landscape — `product:ls_viewer:views:update`
- [x] Landscape — `product:ls_viewer:views:delete`
- [x] Landscape — `product:ls_viewer:layers:update`
- [x] Landscape — `product:ls_viewer:refresh`
- [x] Community — `product:cm_viewer:compliances:update`
- [x] Community — `product:cm_viewer:classes:update`
- [x] Community — `product:cm_viewer:property_details:update`
- [x] Construct — `product:ct_viewer:areas:update`
- [x] Construct — `product:ct_viewer:areas:delete`
- [x] Construct — `product:ct_viewer:classes:update`
- [x] Admin — `admin:developer:connections` (request active connections)
- [x] Admin — `admin:developer:connections:update` (broadcast active connections)
- [x] **Cron — cada 1 minuto:** validar sesiones de sockets, emitir `session_expired` si inválidas
- [x] Persistencia — Socket events actualizan `Job_Deliverable` table
- [x] Client-side singleton (`src/lib/socket/client.ts`)
- [x] React hook `useViewerSocket` (`src/modules/viewers/hooks/use-viewer-socket.ts`)
- [x] Landscape viewer integrado con socket (broadcast al guardar)

### ArcGIS Integration ❌ NO IMPLEMENTADO
- [ ] Query parcels por geometry intersect (ArcGIS REST API)
- [ ] Configuración de servers desde `Products.configuration` (por estado/condado)
- [ ] Integración en Community Viewer
- [ ] Integración en Landscape Viewer (road overlay)
- [ ] Integración en Construct Viewer

---

## PHASE 5 — ADMIN
> Objetivo: Gestión de usuarios, roles, permisos, developer tools

### User Management
- [x] User search — lista con búsqueda (nombre, email, teléfono)
- [x] User search — badges de roles con color por tipo
- [x] User search — indicador 2FA
- [x] User detail page
- [x] API GET/POST users
- [x] API PUT/DELETE user por ID
- [x] API change-password
- [x] API change-2fa
- [x] API kill-session
- [x] API resend-activation
- [x] API delete users
- [x] API update-roles
- [x] API update-permissions
- [x] API restrict user
- [ ] **UI — Crear usuario** *(endpoint existe, modal/form no verificado)*
- [ ] **UI — Editar roles de usuario** *(endpoint existe, UI no verificada)*
- [ ] **UI — Editar permisos de usuario** *(endpoint existe, UI no verificada)*
- [ ] **UI — Kill session de usuario** *(endpoint existe, UI no verificada)*
- [ ] **UI — Cambiar password de usuario** *(endpoint existe, UI no verificada)*
- [ ] Last Activity column (combina job involvement + viewer activity)

### Roles & Permissions Page
- [x] Route `/admin/users/roles` existe
- [ ] **Socket events** para roles & permissions (requieren Socket.IO):
  - [ ] `permission:details` — Get permission object
  - [ ] `permission:save` — Create/update permission
  - [ ] `permission:delete` — Delete permission
  - [ ] `role:details` — Get role object
  - [ ] `role:save` — Create/update role
  - [ ] `role:delete` — Delete role
  - [ ] `role:order` — Reorder roles
  - [ ] `role:permissions` — Get role's permissions
  - [ ] `role:permissions:update` — Toggle permission on role
  - [ ] `user:roles` — Get user's roles
  - [ ] `user:permissions` — Get user's permissions
  - [ ] `user:permissions:update` — Toggle permission on user
  - [ ] `users:online` — List online users
  - [ ] `user:status` — Check if user is online

### Developer Tools
- [x] Route `/admin/developer/active-visitors` existe
- [ ] **Active Connections Monitor** — UI de la page `/admin/developer/active-visitors` *(socket handler ya implementado, falta la UI)*

### Admin Dashboard
- [x] 5 conteos básicos (users, jobs, sites, orgs, tilesets)
- [ ] Métricas reales de actividad del sistema
- [ ] Audit logs funcionales
- [ ] System health dashboard

---

## PHASE 6 — POLISH
> Objetivo: Client portal, onboarding, maintenance, monitoring

### Client Portal
- [x] Client home — dashboard con stats de jobs y sites
- [x] Client home — exportar CSV de jobs
- [x] Sites list para cliente
- [x] Job detail para cliente
- [x] Job product/viewer para cliente
- [ ] **OAuth — Google login flow** *(page `/client/oauth` existe, lógica no verificada)*

### Onboarding
- [x] Manage Companies — lista con búsqueda, conteo de contactos/jobs
- [ ] Add Company — **form mínimo**, sin validaciones avanzadas, sin lógica de Organization_Meta
- [ ] Add Contact — **form básico**, sin lógica completa de creación de usuario cliente
- [ ] Onboard Contact — enviar email `register-account` al nuevo contacto

### Settings (User Profile)
- [x] Display de perfil (nombre, email, roles)
- [x] Theme toggle (dark/light)
- [x] **Password change** — endpoint `/api/auth/change-password` creado y settings page actualizada
- [ ] 2FA setup/disable desde settings
- [ ] Notification preferences (placeholder actual)

### Infrastructure
- [ ] **Maintenance mode** — middleware que bloquea acceso excepto whitelist
- [ ] **Sentry error tracking** *(no está en dependencies)*
- [ ] Google OAuth login
- [ ] HubSpot CRM sync *(opcional)*
- [ ] Performance optimization
- [ ] CORS configurado para producción (`hub.prodrones.com`, `client.prodrones.com`, `admin.prodrones.com`)

---

## APIs — VERIFICACIÓN DE ENDPOINTS

### Auth API ✅
- [x] `POST /api/auth/login`
- [x] `POST /api/auth/logout`
- [x] `POST /api/auth/verify-2fa`
- [x] `GET /api/auth/metadata`
- [x] `POST /api/auth/register`
- [x] `POST /api/auth/forgot-password`
- [x] `POST /api/auth/reset-password`

### Workflow — Jobs API ✅
- [x] `GET /api/workflow/jobs` (dashboard, todos los jobs por pipeline)
- [x] `POST /api/workflow/jobs` (crear job)
- [x] `GET /api/workflow/jobs/[id]`
- [x] `PUT /api/workflow/jobs/[id]` (editar)
- [x] `DELETE /api/workflow/jobs/[id]`
- [x] `POST /api/workflow/jobs/[id]/approve`
- [x] `POST /api/workflow/jobs/[id]/schedule`
- [x] `POST /api/workflow/jobs/[id]/log-flight`
- [x] `POST /api/workflow/jobs/[id]/deliver`
- [x] `POST /api/workflow/jobs/[id]/bill`
- [x] `POST /api/workflow/jobs/[id]/bill-paid`
- [x] `GET /api/workflow/jobs/export` (CSV)
- [ ] `GET /api/workflow/jobs/dashboard/[pipe]` (load more por pipeline — paginación)
- [ ] `GET /api/workflow/jobs/[id]/attachment` (download adjunto/ZIP)

### Workflow — Bulk API ✅
- [x] `GET /api/workflow/bulk/jobs`
- [x] `POST /api/workflow/bulk/approve`
- [x] `POST /api/workflow/bulk/schedule`
- [x] `POST /api/workflow/bulk/flight-log`
- [x] `POST /api/workflow/bulk/deliver`
- [x] `POST /api/workflow/bulk/bill`
- [x] `POST /api/workflow/bulk/delete`

### Workflow — Sites API ✅
- [x] `GET /api/workflow/sites`
- [x] `GET /api/workflow/sites/[id]`
- [x] `POST /api/workflow/sites/create`
- [x] `POST /api/workflow/sites/edit`
- [x] `GET /api/workflow/sites/export`
- [ ] `POST /api/workflow/sites/boundaries` (batch fetch boundaries, max 10)

### Recurring Jobs API ✅
- [x] `GET /api/recurring`
- [x] `GET /api/recurring/[id]`
- [x] `GET /api/recurring/preview-schedule`
- [x] `POST /api/recurring/create`
- [x] `POST /api/recurring/update`
- [x] `POST /api/recurring/delete`
- [x] `POST /api/recurring/generate-all`
- [x] `GET /api/recurring/[id]/occurrences`
- [x] `POST /api/recurring/[id]/skip-occurrence`
- [x] `POST /api/recurring/[id]/add-to-bids`
- [x] `POST /api/recurring/[id]/generate`

### Organizations API ✅
- [x] `GET /api/organizations`
- [x] `POST /api/organizations`
- [x] `GET /api/organizations/[id]`
- [ ] `POST /api/organizations/[id]/contact/add`
- [ ] `POST /api/organizations/[id]/contact/remove`
- [ ] `POST /api/organizations/[id]/contact/make-primary`

### Onboarding API ⚠️
- [ ] `POST /api/onboard/company/create`
- [ ] `POST /api/onboard/company/update`
- [ ] `POST /api/onboard/company/archive`
- [ ] `POST /api/onboard/company/bulk-archive`
- [x] `POST /api/onboard/contacts` *(existe, verificar implementación)*

### Admin API ⚠️
- [x] `GET /api/admin/users/search`
- [x] `GET /api/admin/user/[id]`
- [x] `POST /api/admin/user/create`
- [x] `POST /api/admin/user/change-password`
- [x] `POST /api/admin/user/change-2fa`
- [x] `POST /api/admin/user/kill-session`
- [x] `POST /api/admin/user/resend-activation`
- [x] `POST /api/admin/user/delete`
- [x] `POST /api/admin/user/update-roles`
- [x] `POST /api/admin/user/update-permissions`
- [x] `POST /api/admin/user/restrict`
- [x] `GET /api/admin/permissions`
- [x] `GET /api/admin/sessions`

### Tileset API ⚠️
- [x] `GET /api/tilesets`
- [x] `POST /api/tilesets` (crear)
- [x] `GET /api/tiles/[...path]` (servir XYZ tiles)
- [ ] `GET /api/tileset/[id]`
- [ ] `POST /api/tileset/update`
- [ ] `POST /api/tileset/delete`

### Share API ✅
- [x] `POST /api/share`
- [x] `DELETE /api/share`
- [x] `GET /api/share` (list shares for a page)
- [x] `GET /api/share/validate/[token]`

### Client API ✅
- [x] `GET /api/client/jobs`
- [x] `GET /api/client/jobs/export`
- [x] `GET /api/client/sites`
- [ ] `GET /api/client/company/jobs`

### Viewer API ⚠️
- [x] `GET /api/viewer/[jobProductId]`
- [x] `GET /api/viewer/[jobProductId]/tileset`
- [ ] Viewer endpoints para actualizar deliverable data (actualmente via Socket.IO)

### Upload API ✅
- [x] `POST /api/upload/initiate`
- [x] `POST /api/upload/chunk`
- [x] `POST /api/upload/complete`
- [x] `GET /api/upload/status`
- [x] `DELETE /api/upload/cancel`

### Email API ⚠️
- [x] `GET/POST /api/emails`
- [x] `GET /api/emails/preview`
- [x] `GET/PUT/DELETE /api/emails/[id]`
- [x] `POST /api/emails/test-email`

### Otros ✅
- [x] `GET /api/health`
- [x] `GET /api/config`
- [x] `GET /api/search`
- [x] `POST /api/cron/recurring-jobs`
- [x] `GET/POST /api/realtime/presence/[jobProductId]`
- [x] `POST /api/realtime/presence/heartbeat`

---

## REGLAS CRÍTICAS — CHECKLIST DEL SISTEMA
> Estas reglas del `initial prompt.md` deben estar siempre respetadas

- [x] NO modificar schema de DB (datos de producción)
- [x] Columnas generadas (`Jobs.client_id`, `Jobs.client_type`) son READ-ONLY — nunca en INSERT/UPDATE
- [x] Siempre llamar `update_job_pipeline(job_id)` tras modificar campos de pipeline
- [x] Session tokens en `Users.Tokens` JSON array (no tabla separada)
- [x] NULL-safe equality para `client_id`/`client_type` en SQL
- [ ] `CONVERT(... USING utf8mb4)` en queries que combinan User_Meta + JSON *(verificar)*
- [x] `MAX()` en LEFT JOINs agrupados (MySQL `only_full_group_by`)
- [ ] Email worker persistente — no usar in-memory queues *(pendiente de implementar)*
- [x] Tileset paths son relativos — resolver contra `Content_Delivery/tilesets/`
- [x] Patrón EAV (`meta_key`/`meta_value`) en User_Meta, Job_Meta, Org_Meta, Job_Deliverable
- [ ] Chunked uploads soportados *(endpoints existen, verificar Dropzone protocol completo)*
- [ ] Socket session validation cron — cada 1 minuto *(requiere Socket.IO)*
- [x] Tabla `Requests` para navegación segura — tokens en vez de params en URL
- [x] Roles en `Configuration` table (key `roles`), NO en tabla separada
- [ ] CORS explícito para producción (no `*`) con `Access-Control-Allow-Credentials: true`
- [ ] Admin password change elimina TODOS los tokens session del usuario
- [x] 3 modos de 2FA admin: `disable`, `mobile` (QR setup), `email` (código por email)
- [x] Patrón `saveToUser()` — actualiza `Users` + `User_Meta` en una sola operación

---

## INTEGRACIONES EXTERNAS

- [ ] **FAST Portal** — mantener endpoints backward-compatible (`/api/tileset/list`, `/api/tileset/[id]`)
- [ ] **Google OAuth** — login via Google account
- [ ] **HubSpot CRM** — sync de company data *(opcional)*
- [ ] **FAA LAANC** — airspace data via ArcGIS *(opcional)*
- [ ] **Sentry** — error tracking en producción

---

## RESUMEN DE PROGRESO POR FASE

| Phase | Nombre | Completado |
|---|---|---|
| Phase 1 | Foundation | ~95% |
| Phase 2 | Core Business | ~75% |
| Phase 3 | Advanced Features | ~65% |
| Phase 4 | Viewers | ~75% |
| Phase 5 | Admin | ~50% |
| Phase 6 | Polish | ~35% |
| **TOTAL** | | **~72%** |

---

## TOP PENDIENTES CRÍTICOS

1. ~~**Socket.IO**~~ — ✅ Completado
2. ~~**Share Link System**~~ — ✅ Completado
3. ~~**Settings password change**~~ — ✅ Completado
4. ~~**Batched Email Worker**~~ — ✅ Completado (worker persistente en server.ts + cron endpoint)
5. **Organization detail** — contacts management (add, remove, primary) sin implementar
6. **Bulk Operations UI** — BulkApproveModal, BulkFlightLogModal, BulkDeliveryModal
7. **Admin Active Connections UI** — socket handler listo, falta la page
8. **Admin UI completa** — user-edit, roles/perms management UI
9. **Onboarding** — Add Company y Add Contact son stubs básicos
10. **Community Viewer & Construct Viewer** — verificar/completar funcionalidad core
