# ProDrones Hub V5 - Plan de Trabajo

## Estado Actual del Proyecto
**Fecha**: 2026-02-12
**Stack**: Next.js 15 + React 19 + Drizzle ORM + MySQL (localhost:3309)
**Dev Server**: puerto 3005
**Base de datos**: `prodrones_application` en `localhost:3309` (root:devroot123)

---

## COMPLETADO

### P0 #1 - Job Pipeline Operations (DONE)
Todas las operaciones individuales de pipeline de jobs están implementadas y testeadas.

**Archivos creados:**
- `prodrones-hub/src/modules/workflow/schemas/job-schemas.ts` - 7 schemas Zod (approve, schedule, logFlight, deliver, bill, billPaid, editJob)
- `prodrones-hub/src/modules/workflow/services/job-service.ts` - getJobById(), updateJobDates(), getJobMeta()
- `prodrones-hub/src/app/api/workflow/jobs/[id]/route.ts` - GET/POST/DELETE job individual
- `prodrones-hub/src/app/api/workflow/jobs/[id]/approve/route.ts`
- `prodrones-hub/src/app/api/workflow/jobs/[id]/schedule/route.ts`
- `prodrones-hub/src/app/api/workflow/jobs/[id]/log-flight/route.ts`
- `prodrones-hub/src/app/api/workflow/jobs/[id]/deliver/route.ts`
- `prodrones-hub/src/app/api/workflow/jobs/[id]/bill/route.ts`
- `prodrones-hub/src/app/api/workflow/jobs/[id]/bill-paid/route.ts`

**Archivo modificado:**
- `prodrones-hub/src/app/api/workflow/jobs/route.ts` - POST ahora acepta products[], notes, amountPayable + llama callUpdateJobPipeline

**Bug corregido:** Products en la DB están como objetos `[{id:5,name:"X"}]` no como números `[5]`. Se corrigió el mapeo tanto en job-service.ts como en route.ts del listado.

**Pipeline completo testeado:** bids → scheduled → processing-deliver → bill → completed (con curl y cookie pds_session)

### P0 #2 - Bulk Operations (DONE)
Sistema completo de operaciones en lote implementado y compilando sin errores.

**Archivos creados:**
- `prodrones-hub/src/modules/workflow/schemas/bulk-schemas.ts` - 7 schemas Zod para bulk ops
- `prodrones-hub/src/modules/workflow/services/bulk-service.ts` - executeBulkAction() con logging y error handling
- `prodrones-hub/src/app/api/workflow/bulk/jobs/route.ts` - GET múltiples jobs
- `prodrones-hub/src/app/api/workflow/bulk/approve/route.ts` - POST bulk approve
- `prodrones-hub/src/app/api/workflow/bulk/schedule/route.ts` - POST bulk schedule
- `prodrones-hub/src/app/api/workflow/bulk/flight-log/route.ts` - POST bulk flight log
- `prodrones-hub/src/app/api/workflow/bulk/deliver/route.ts` - POST bulk deliver
- `prodrones-hub/src/app/api/workflow/bulk/bill/route.ts` - POST bulk bill
- `prodrones-hub/src/app/api/workflow/bulk/delete/route.ts` - POST bulk delete

**Características:**
- Logging automático en `Bulk_Action_Log` con estados: started, completed, failed, partial
- Error isolation: si un job falla, los demás continúan procesándose
- Respuesta detallada con total, succeeded, failed y array de errores individuales

---

## SIGUIENTE: P0 #3 - File Upload System

### Contexto
Los tilesets pueden ser archivos de varios GB. Se necesita un sistema de chunked uploads robusto con progress tracking y resume capability.

### Archivos creados
1. `src/modules/upload/schemas/upload-schemas.ts` - Schemas Zod para init, chunk, complete
2. `src/modules/upload/services/upload-service.ts` - Servicio completo de upload (FS + DB)
3. `src/lib/db/schema/upload.ts` - Tablas `Upload_Session` y `Upload_Chunk`
4. `src/app/api/upload/initiate/route.ts` - POST init upload
5. `src/app/api/upload/chunk/route.ts` - POST upload chunk
6. `src/app/api/upload/complete/route.ts` - POST complete upload
7. `src/app/api/upload/status/route.ts` - GET status & missing chunks
8. `src/app/api/upload/cancel/route.ts` - POST cancel upload

### Estado
- Backend implementado y compilando
- Migración SQL creada (`migrations/add-upload-tables.sql`)
- Falta testing y verificar frontend integration

---

---

## ROADMAP COMPLETO (Prioridades)

### P0 - Critical (Blocks system usage)
1. ~~Job Pipeline Operations~~ **DONE**
2. ~~Bulk Operations~~ **DONE**
3. ~~File Upload System~~ **DONE** (2026-02-12)
   - Schema DB: `Upload_Session`, `Upload_Chunk` (Completed)
   - Service: chunk handling, resume logic, assembly (Completed)
   - API Routes: initiate, chunk upload, status, complete, cancel (Completed)
   - Documentation: `UPLOAD-SYSTEM.md` (Completed)
4. ~~Complete Email System~~ **DONE** (2026-02-15)
   - Schema DB: `Email_Log` (Completed)
   - Service: Multi-provider email service (Console, Ethereal, Resend, SendGrid) (Completed)
   - Templates: 6 React Email templates (2FA, Reset, Signup, Pilot, Delivery, Status) (Completed)
   - Template Engine: React Email → HTML rendering (Completed)
   - Documentation: `EMAIL-SYSTEM.md` (Completed)
   - Test Script: `scripts/test-email.ts` (Completed)
5. ~~Signup/Forgot/Reset Password~~ **DONE** (2026-02-15)
   - Service Functions: register(), forgotPassword(), resetPassword() (Completed)
   - API Routes: /api/auth/register, /api/auth/forgot-password, /api/auth/reset-password (Completed)
   - Frontend Pages: /auth/register, /auth/forgot-password, /auth/reset-password (Completed)
   - Email Templates: password-changed.tsx (Completed)
   - Security: Rate limiter, email enumeration prevention, token expiry (Completed)
   - Fix: 2FA email sending in login flow (Completed)
   - Documentation: Complete README.md + CHANGELOG.md (Completed)

### P1 - High Priority
6. ~~Complete Organization CRUD~~ **DONE** (2026-02-15)
   - Schemas: createOrganizationSchema, updateOrganizationSchema (Completed)
   - Service Layer: CRUD functions with metadata support (Completed)
   - API Routes: GET, POST, GET/:id, PUT/:id, DELETE/:id (Completed)
   - Types: TypeScript interfaces and Zod inferred types (Completed)
   - Security: Job validation on delete, authentication required (Completed)
   - Documentation: ORGANIZATION-CRUD.md (Completed)
7. ~~Recurring Job Generation (RRULE worker)~~ **DONE** (2026-02-15)
   - RRULE Occurrence Generator: generateOccurrences(), previewOccurrences(), validateRRule() (Completed)
   - Service Layer: CRUD + processActiveTemplates() worker function (Completed)
   - API Routes: POST, GET/:id, PUT/:id, DELETE/:id, generate endpoint (Completed)
   - Worker Endpoint: /api/cron/recurring-jobs with CRON_SECRET auth (Completed)
   - Vercel Cron: Configured hourly execution (Completed)
   - Documentation: RECURRING-JOBS.md with examples and troubleshooting (Completed)
8. Viewer Socket.IO events
9. Stored Procedure integration completa

### P2 - Medium
10. Site boundary editor (Leaflet Draw)
11. Share link system
12. Complete Tileset CRUD
13. Complete Client portal
14. Missing 17 permissions

### P3 - Nice to have
15. FullCalendar, Monaco Editor, Rich Text, PDF generation, Sentry, MapLibre GL, Maintenance mode

---

## Archivos clave para referencia

| Archivo | Contenido |
|---------|-----------|
| `src/lib/db/helpers.ts` | setMetaValue, getMetaMap, callUpdateJobPipeline, deleteMetaValue |
| `src/lib/db/schema/jobs.ts` | jobs, jobMeta, jobDeliverable tables |
| `src/lib/db/schema/bulk-action-log.ts` | bulkActionLog table |
| `src/lib/db/schema/index.ts` | Re-exports all schemas |
| `src/lib/utils/api.ts` | successResponse, errorResponse, notFoundResponse |
| `src/lib/auth/middleware.ts` | withAuth, withRole, withPermission |
| `src/lib/constants.ts` | ROLES, PIPELINES, PIPELINE_ORDER |
| `src/modules/workflow/schemas/job-schemas.ts` | Zod schemas para acciones individuales |
| `src/modules/workflow/services/job-service.ts` | getJobById, updateJobDates, getJobMeta |
| `src/app/api/workflow/jobs/route.ts` | GET listado + POST crear job |

## Notas importantes
- Cookie de sesión se llama `pds_session`
- Products en DB seed están como objetos `[{id:5,name:"X"}]`, no números simples
- clientId y clientType en Jobs son GENERATED COLUMNS (read-only) - se derivan del JSON `client`
- Zod v4 requiere 2 args para `z.record(z.string(), z.unknown())`
- El stored procedure `update_job_pipeline` recalcula el pipeline basándose en dates JSON + meta keys
- TypeScript compila sin errores a la fecha
