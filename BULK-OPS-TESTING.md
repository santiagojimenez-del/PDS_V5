# Bulk Operations - Testing Guide

## Endpoints Implementados

### 1. GET Bulk Jobs
```bash
GET /api/workflow/bulk/jobs?ids=1,2,3
```

### 2. POST Bulk Approve
```bash
POST /api/workflow/bulk/approve
{
  "jobIds": [1, 2, 3],
  "approvedFlight": "2026-03-01"
}
```

### 3. POST Bulk Schedule
```bash
POST /api/workflow/bulk/schedule
{
  "jobIds": [1, 2, 3],
  "scheduledDate": "2026-03-15",
  "scheduledFlight": "2026-03-15",
  "personsAssigned": [5, 8]
}
```

### 4. POST Bulk Flight Log
```bash
POST /api/workflow/bulk/flight-log
{
  "jobIds": [1, 2, 3],
  "flownDate": "2026-03-15",
  "flightLog": {
    "duration": 45,
    "weather": "clear"
  }
}
```

### 5. POST Bulk Deliver
```bash
POST /api/workflow/bulk/deliver
{
  "jobIds": [1, 2, 3],
  "deliveredDate": "2026-03-16"
}
```

### 6. POST Bulk Bill
```bash
POST /api/workflow/bulk/bill
{
  "jobIds": [1, 2, 3],
  "invoiceNumber": "INV-2026-001",
  "billedDate": "2026-03-17"
}
```

### 7. POST Bulk Delete
```bash
POST /api/workflow/bulk/delete
{
  "jobIds": [1, 2, 3]
}
```

## Respuesta Esperada

Todas las operaciones bulk retornan:

```json
{
  "success": true,
  "data": {
    "total": 3,
    "succeeded": 2,
    "failed": 1,
    "errors": [
      {
        "jobId": 99,
        "error": "Job not found"
      }
    ]
  }
}
```

## Verificación en Base de Datos

Después de cada operación bulk, verificar en `Bulk_Action_Log`:

```sql
SELECT * FROM Bulk_Action_Log ORDER BY created_at DESC LIMIT 10;
```

Estados posibles:
- `started` - Operación iniciada
- `completed` - Todos los jobs procesados exitosamente
- `partial` - Algunos jobs fallaron
- `failed` - Todos los jobs fallaron

## Testing con curl (Windows PowerShell)

```powershell
# 1. Login primero para obtener cookie pds_session
curl -X POST http://localhost:3005/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"password"}' `
  -c cookies.txt

# 2. Usar la cookie en requests bulk
curl -X GET "http://localhost:3005/api/workflow/bulk/jobs?ids=1,2,3" `
  -b cookies.txt

curl -X POST http://localhost:3005/api/workflow/bulk/approve `
  -H "Content-Type: application/json" `
  -b cookies.txt `
  -d '{"jobIds":[1,2],"approvedFlight":"2026-03-01"}'
```
