# ProDrones Hub V5 — Demo Guide

> Guía completa para demostrar la plataforma paso a paso.
> Servidor local: **http://localhost:3005**

---

## Índice

1. [Arquitectura de la plataforma](#1-arquitectura)
2. [Acceso y roles](#2-acceso-y-roles)
3. [Portal Hub — Staff / Admin / Pilot](#3-portal-hub)
4. [Portal Client — Clientes](#4-portal-client)
5. [Panel Admin — Administración](#5-panel-admin)
6. [Viewers públicos](#6-viewers-públicos)
7. [Flujo completo de un trabajo](#7-flujo-completo-de-un-trabajo)
8. [URLs de referencia rápida](#8-urls-de-referencia-rápida)

---

## 1. Arquitectura

La plataforma tiene **tres portales** que corren en el mismo servidor pero con contextos separados. El portal se selecciona por:

| Método | Hub | Client | Admin |
|--------|-----|--------|-------|
| Query param | `?app=hub` | `?app=client` | `?app=admin` |
| Subdominio | `hub.localhost:3005` | `client.localhost:3005` | `admin.localhost:3005` |
| Default | ✅ (sin param) | — | — |

**Roles de usuario (numéricos en DB):**

| Número | Nombre | Portal principal |
|--------|--------|-----------------|
| 0 | Admin | Hub + Admin |
| 1 | Client | Client |
| 3 | Registered | Client |
| 4 | Developer | Hub + Admin |
| 5 | Staff | Hub |
| 6 | Pilot | Hub |
| 7 | Manager | Hub |

---

## 2. Acceso y Roles

### 2.1 Registro y Login

**URL:** `http://localhost:3005/login`

1. Ir a `/login`
2. Ingresar email y contraseña
3. Si el usuario tiene **2FA activado**, se solicitará el código TOTP
4. El sistema redirige automáticamente según el rol:
   - Client → `/sites`
   - Staff / Admin / Pilot / Manager → `/workflow/jobs`

**Credenciales de demo (DB local):**
```
Admin:   (usar cuenta admin en prodrones_application)
Cliente: (usar cuenta con rol 1 o 3)
Pilot:   (usar cuenta con rol 6)
```

### 2.2 Registro de nuevo usuario

**URL:** `http://localhost:3005/register`

- Llena nombre, email y contraseña
- El rol por defecto es `Registered (3)` — un Admin debe asignar roles adicionales

### 2.3 Recuperación de contraseña

**URL:** `http://localhost:3005/forgot-password`

- Ingresa el email
- El sistema envía un link de reset (en dev usa Ethereal — verificar consola del servidor para el preview URL)

---

## 3. Portal Hub

> Acceso: usuarios con roles Admin (0), Manager (7), Staff (5), Pilot (6), Developer (4)
> URL base: `http://localhost:3005` (default) o `http://localhost:3005?app=hub`

### 3.1 Dashboard principal

**URL:** `http://localhost:3005/`

Muestra:
- Contador de jobs por pipeline (Bids, Scheduled, Processing, Bill, Completed)
- Actividad reciente
- Acceso rápido a módulos

---

### 3.2 Módulo Workflow — Jobs

#### Ver todos los jobs
**URL:** `http://localhost:3005/workflow/jobs`

- Lista de todos los trabajos con su estado actual (pipeline)
- Filtros por pipeline, búsqueda por nombre
- Botón **New Job** → crea un trabajo nuevo
- Selección múltiple para acciones en lote (aprobar, programar, etc.)

#### Crear un job nuevo
**URL:** `http://localhost:3005/workflow/jobs/new`

Pasos:
1. Ingresar **nombre del trabajo**
2. Seleccionar **sitio** (Site)
3. Seleccionar **fecha de vuelo propuesta**
4. Marcar los **productos** requeridos (Landscape, Community, Construct)
5. Agregar **notas** opcionales
6. Ingresar **monto a cobrar** (Amount Payable)
7. Click **Create Job** → redirige al detalle del job creado

#### Detalle de un job
**URL:** `http://localhost:3005/workflow/jobs/{id}`

Muestra:
- Información del job (sitio, cliente, fechas, monto)
- Pipeline actual con botones de acción según el estado:
  - **Bids** → botón Approve (define fecha de vuelo aprobada)
  - **Scheduled** → botón Schedule (asigna fecha + pilotos/staff)
  - **Processing/Deliver** → botón Log Flight (registra vuelo completado)
  - **Bill** → botón Deliver + Bill (genera factura)
  - **Completed** → trabajo finalizado
- Sección de **productos** con botón de compartir (Share) por producto
- Historial de cambios

#### Acciones en lote
En la lista de jobs, seleccionar varios con el checkbox y usar los botones de acción en la barra superior para:
- Aprobar múltiples jobs a la vez
- Programar múltiples jobs
- Etc.

---

### 3.3 Módulo Workflow — Sites

**URL:** `http://localhost:3005/workflow/sites`

- Lista de todos los sitios con dirección y cliente asociado
- Botón **New Site** para agregar
- Click en un sitio → detalle con jobs asociados

---

### 3.4 Módulo Workflow — Recurring Jobs

**URL:** `http://localhost:3005/workflow/recurring`

Templates de trabajos recurrentes.

#### Crear un template
1. Click **New Template**
2. Nombre, sitio y cliente
3. Elegir tipo:
   - **Automático**: configura frecuencia (diaria/semanal/mensual/anual), días y rango de fechas
   - **Manual**: toggle "Manual trigger" activado — sin schedule automático
4. Timezone y ventana de días (window)
5. Monto y notas
6. **Create Template**

#### Generar occurrences
- Botón ⚡ (rayo) en cada template → genera las próximas ocurrencias
  - Template automático: genera según RRULE hasta la ventana de días
  - Template manual: crea UNA ocurrencia en el momento actual (on-demand)
- Las ocurrencias aparecen como "planned" y pueden convertirse en jobs reales

#### Otros controles por template
- 🔌 Toggle activo/inactivo
- ✏️ Editar
- 🗑️ Eliminar (solo si no tiene jobs creados)

---

### 3.5 Módulo Billing

**URL:** `http://localhost:3005/billing`

Dashboard con:
- Total facturado, pendiente de pago, vencido
- Lista de facturas con estado (Draft, Sent, Paid, Overdue, Cancelled)

#### Crear factura
**URL:** `http://localhost:3005/billing/invoices/new`

1. Seleccionar job asociado
2. Número de factura
3. Fecha de emisión y vencimiento
4. Items (descripción, cantidad, precio)
5. **Create Invoice**

#### Detalle de factura
**URL:** `http://localhost:3005/billing/invoices/{id}`

- Ver/editar ítems
- Registrar pago (fecha, monto, método)
- **Descargar PDF** → genera PDF de la factura
- Cambiar estado (Draft → Sent → Paid)

---

### 3.6 Módulo Scheduling — Pilotos

**URL:** `http://localhost:3005/scheduling/pilots`

Lista de todos los usuarios con rol Pilot (6) o Staff (5).

#### Configurar disponibilidad de un piloto
**URL:** `http://localhost:3005/scheduling/pilots/{id}`

1. **Availability** — marcar qué días de la semana está disponible (lunes-domingo)
2. **Blackout Dates** — agregar períodos de no disponibilidad (vacaciones, etc.)

#### Mi horario (para pilotos/staff)
**URL:** `http://localhost:3005/scheduling/my-schedule`

El piloto/staff ve sus propias asignaciones y disponibilidad.

#### Smart Pilot Assignment
Al programar un job (Schedule dialog), el sistema muestra **sugerencias de pilotos** con score automático basado en:
- Disponibilidad del día de la semana
- Blackout dates
- Carga de trabajo semanal/mensual
- Conflictos de doble booking

---

### 3.7 Módulo Onboarding — Clientes y Organizaciones

#### Contactos
**URL:** `http://localhost:3005/onboard/contact`
**URL:** `http://localhost:3005/onboard/contact/manage`

Gestión de contactos individuales.

#### Organizaciones/Empresas
**URL:** `http://localhost:3005/onboard/company`
**URL:** `http://localhost:3005/onboard/company/manage`
**URL:** `http://localhost:3005/onboard/company/manage/{id}`

Gestión de empresas clientes con sus datos completos.

---

### 3.8 Módulo Tilesets

**URL:** `http://localhost:3005/tilesets`
**URL:** `http://localhost:3005/tilesets/manage`

Gestión de capas de mapas (tilesets) para los viewers.

---

### 3.9 Settings de usuario

**URL:** `http://localhost:3005/settings`

El usuario autenticado puede:
- **Edit Profile**: cambiar first name, last name, phone number
- **Notifications**: activar/desactivar notificaciones por email y por cambio de estado de jobs
- **Change Password**: cambiar contraseña
- **Two-Factor Auth**: activar/desactivar TOTP (Google Authenticator)

---

## 4. Portal Client

> Acceso: usuarios con roles Client (1) o Registered (3)
> URL base: `http://localhost:3005?app=client`

### 4.1 Dashboard del cliente
**URL:** `http://localhost:3005/?app=client`

Muestra:
- Resumen de jobs: total, completados, en progreso
- Lista de sitios del cliente
- Jobs recientes con estado
- Botón **Export CSV** para descargar todos sus jobs

### 4.2 Mis sitios
**URL:** `http://localhost:3005/sites?app=client`

Lista de todos los sitios asociados al cliente con conteo de jobs por sitio.

### 4.3 Detalle de sitio
**URL:** `http://localhost:3005/site/{id}?app=client`

Jobs del cliente en ese sitio específico.

### 4.4 Detalle de job
**URL:** `http://localhost:3005/job/{id}?app=client`

El cliente ve:
- Estado del trabajo en el pipeline
- Fechas (propuesta, aprobada, programada, completada)
- Productos disponibles

### 4.5 Producto/Deliverable
**URL:** `http://localhost:3005/job/{id}/product/{productId}?app=client`

Vista del deliverable específico de un job (con acceso al viewer correspondiente).

---

## 5. Panel Admin

> Acceso: usuarios con rol Admin (0) o Developer (4)
> URL base: `http://localhost:3005?app=admin`

### 5.1 Dashboard admin
**URL:** `http://localhost:3005/?app=admin`

Estadísticas globales del sistema:
- Total usuarios, jobs, sitios, organizaciones
- Jobs por pipeline
- Usuarios activos

### 5.2 Búsqueda de usuarios
**URL:** `http://localhost:3005/users/search?app=admin`

- Búsqueda por nombre o email
- Ver rol y estado de cada usuario
- Click en usuario → detalle completo

### 5.3 Detalle de usuario
**URL:** `http://localhost:3005/users/{id}?app=admin`

El admin puede:
- Editar nombre, teléfono
- **Cambiar roles** (checkboxes: Admin, Client, Staff, Pilot, Manager, etc.)
- **Cambiar permisos** granulares (agrupados por categoría)
- **Change Password** + matar sesiones automáticamente
- **Kill Sessions** → invalida todos los tokens activos del usuario
- **Delete User** (con confirmación)
- Ver jobs y sitios creados por ese usuario

### 5.4 Roles & Permisos
**URL:** `http://localhost:3005/users/roles?app=admin`

Vista de todos los roles con sus permisos asociados.

### 5.5 Audit Logs
**URL:** `http://localhost:3005/audit-logs?app=admin`

Registro de todas las acciones importantes del sistema con usuario, fecha y detalle.

### 5.6 System Health
**URL:** `http://localhost:3005/system-health?app=admin`

- Estado en tiempo real: Database, API, Email
- Uptime del servidor
- Versiones: Node.js, Next.js, App
- **Maintenance Mode**: toggle para poner el sitio en mantenimiento
  - Con mantenimiento activo → usuarios no autenticados ven `/maintenance`
  - Usuarios autenticados siguen con acceso normal

### 5.7 Active Connections (Developer Tools)
**URL:** `http://localhost:3005/developer/active-visitors?app=admin`

Monitoreo en tiempo real:
- **Socket Connections**: usuarios conectados vía WebSocket (con rooms activos)
- **HTTP Sessions**: usuarios con tokens de sesión válidos
  - Botón 🚪 (logout) por usuario → mata todas sus sesiones inmediatamente
- Actualización automática cada 30s + botón Refresh
- Indicador de estado del socket (Live / Connecting / Disconnected)

---

## 6. Viewers Públicos

Los viewers son páginas accesibles con un **share token** o link directo. No requieren login si el token es válido.

| Viewer | URL | Descripción |
|--------|-----|-------------|
| Landscape | `http://localhost:3005/viewer/landscape/{jobProductId}` | Mapa aéreo/topográfico |
| Community | `http://localhost:3005/viewer/community/{jobProductId}` | Vista comunitaria |
| Construct | `http://localhost:3005/viewer/construct/{jobProductId}` | Vista de construcción/3D |

### Cómo compartir un viewer desde el Hub

1. Ir al detalle de un job: `/workflow/jobs/{id}`
2. En la sección **Products**, hacer click en el ícono 🔗 (share) del producto deseado
3. Se abre el **Share Modal** con:
   - Link directo al viewer
   - Opción de copiar al portapapeles
4. El link puede compartirse con el cliente — no requiere login

---

## 7. Flujo Completo de un Trabajo

Este es el recorrido típico de un trabajo desde su creación hasta la facturación:

```
[Crear Job] → [Aprobar] → [Programar + Asignar Piloto] → [Ejecutar Vuelo] → [Entregar] → [Facturar]
   Bids           Bids        Scheduled                   Processing         Processing    Bill → Completed
```

### Paso 1 — Crear el Job (Staff/Admin)
1. Ir a `http://localhost:3005/workflow/jobs/new`
2. Nombre: `"Survey - Edificio Central"`
3. Site: seleccionar sitio del cliente
4. Fecha propuesta: fecha tentativa del vuelo
5. Productos: marcar `Landscape` y `Construct`
6. Monto: `$1,500.00`
7. Click **Create Job** → queda en pipeline **Bids**

### Paso 2 — Aprobar el Job (Manager/Admin)
1. En la lista de jobs, seleccionar el job creado
2. Click **Approve** → ingresar fecha de vuelo aprobada → **Approve**
3. El job avanza a **Bids** (aprobado, esperando schedule)

### Paso 3 — Programar y asignar piloto (Manager/Admin)
1. Click **Schedule** en el job
2. Ingresar fecha programada y flight info
3. En **Assign Staff/Pilots**, el sistema muestra sugerencias con score:
   - ✅ Sin conflictos = score alto
   - ⚠️ Blackout o día no disponible = score bajo
4. Seleccionar piloto(s) → **Schedule**
5. El job avanza a **Scheduled**

### Paso 4 — Registrar vuelo completado (Pilot/Staff)
1. Click **Log Flight** en el job
2. Fecha de vuelo real
3. Opcional: datos de vuelo en JSON (condiciones, duración, etc.)
4. **Log Flight** → el job avanza a **Processing / Deliver**

### Paso 5 — Marcar como entregado (Staff/Admin)
1. Click **Deliver** en el job
2. Confirmar fecha de entrega → **Mark as Delivered**
3. El job avanza a **Bill**

### Paso 6 — Facturar (Admin/Manager)
1. Click **Bill** en el job
2. Ingresar número de factura (`INV-2026-001`)
3. **Bill Job** → el job avanza a **Completed**

### Paso 6b — Crear factura detallada (opcional)
1. Ir a `http://localhost:3005/billing/invoices/new`
2. Asociar al job, ingresar ítems con detalle
3. **Download PDF** para enviar al cliente

### Paso 7 — Compartir viewer al cliente
1. En el detalle del job, buscar la sección **Products**
2. Click 🔗 en "Landscape" → copiar el link del viewer
3. Enviar al cliente — puede ver el mapa sin login

---

## 8. URLs de Referencia Rápida

### Hub Portal
| Funcionalidad | URL |
|--------------|-----|
| Dashboard | `http://localhost:3005/` |
| Lista de Jobs | `http://localhost:3005/workflow/jobs` |
| Nuevo Job | `http://localhost:3005/workflow/jobs/new` |
| Lista de Sites | `http://localhost:3005/workflow/sites` |
| Recurring Jobs | `http://localhost:3005/workflow/recurring` |
| Billing Dashboard | `http://localhost:3005/billing` |
| Nueva Factura | `http://localhost:3005/billing/invoices/new` |
| Scheduling | `http://localhost:3005/scheduling` |
| Lista de Pilotos | `http://localhost:3005/scheduling/pilots` |
| Mi Horario | `http://localhost:3005/scheduling/my-schedule` |
| Organizaciones | `http://localhost:3005/onboard/company/manage` |
| Tilesets | `http://localhost:3005/tilesets` |
| Settings | `http://localhost:3005/settings` |

### Client Portal
| Funcionalidad | URL |
|--------------|-----|
| Dashboard | `http://localhost:3005/?app=client` |
| Mis Sitios | `http://localhost:3005/sites?app=client` |

### Admin Panel
| Funcionalidad | URL |
|--------------|-----|
| Dashboard | `http://localhost:3005/?app=admin` |
| Buscar Usuarios | `http://localhost:3005/users/search?app=admin` |
| Audit Logs | `http://localhost:3005/audit-logs?app=admin` |
| System Health | `http://localhost:3005/system-health?app=admin` |
| Active Visitors | `http://localhost:3005/developer/active-visitors?app=admin` |
| Maintenance Mode | `http://localhost:3005/system-health?app=admin` (toggle en la página) |

### Auth
| Funcionalidad | URL |
|--------------|-----|
| Login | `http://localhost:3005/login` |
| Register | `http://localhost:3005/register` |
| Forgot Password | `http://localhost:3005/forgot-password` |
| Terms of Service | `http://localhost:3005/tos` |

---

## Notas técnicas del demo

- **Base de datos:** MySQL en `localhost:3309`, base `prodrones_application`
- **phpMyAdmin:** `http://localhost:9010`
- **Email en dev:** Usa Ethereal (fake SMTP) — los emails no se envían realmente. Ver la URL de preview en la consola del servidor (`[Email] Preview URL: https://ethereal.email/...`)
- **Socket.IO:** Conexión automática al cargar cualquier página autenticada. El panel de Active Visitors muestra conexiones en tiempo real
- **Compartir links:** Los links de viewers son públicos — cualquier persona con el link puede ver el mapa sin login
- **Maintenance Mode:** Cuando está activo, usuarios no logueados ven `/maintenance`. Los logueados siguen con acceso completo
