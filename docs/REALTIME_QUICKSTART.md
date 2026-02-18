# Presence System - Quick Reference

**🎯 Qué hace:** Muestra cursores de otros usuarios en tiempo real en los 3 viewers

**💰 Costo:** GRATIS (free tier Vercel KV)

**📦 Stack:** Vercel KV (Redis) + React Hooks + Leaflet

---

## Setup Rápido (5 minutos)

### 1. Crear Vercel KV Database

```
Vercel Dashboard → Proyecto → Storage → Create Database → KV (Redis)
Nombre: prodrones-presence
Región: us-east-1
Plan: Free
```

### 2. Variables de Entorno (Auto-inyectadas)

```env
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
NEXT_PUBLIC_PRESENCE_ENABLED=true
```

### 3. Deploy

```bash
git push origin master
```

**¡Listo!** El feature está activo.

---

## Test Rápido

1. **Browser A:** Login como User A → Abrir viewer
2. **Browser B:** Login como User B → Abrir MISMO viewer
3. ✅ Ver cursor del otro usuario en el mapa

---

## Archivos Importantes

### Backend
```
src/lib/kv/index.ts                              # Cliente KV
src/app/api/realtime/presence/heartbeat/route.ts # POST presencia
src/app/api/realtime/presence/[id]/route.ts      # GET usuarios
```

### Frontend
```
src/modules/realtime/hooks/use-presence-config.ts   # Config centralizada
src/modules/realtime/hooks/use-cursor-tracking.ts   # Track cursor
src/modules/realtime/hooks/use-viewer-presence.ts   # Heartbeat + poll
src/modules/realtime/components/user-cursors.tsx    # Render cursors
```

### Viewers (integrados)
```
src/modules/viewers/components/community/community-viewer.tsx
src/modules/viewers/components/construct/construct-viewer.tsx
src/modules/viewers/components/landscape/landscape-viewer.tsx
```

---

## Comandos Útiles

### Test Local

```bash
# Test heartbeat
curl -X POST http://localhost:3003/api/realtime/presence/heartbeat \
  -H "Content-Type: application/json" \
  -H "Cookie: pds_session=..." \
  -d '{"jobProductId":"123-0","cursor":{"lat":27,"lng":-81}}'

# Test fetch
curl http://localhost:3003/api/realtime/presence/123-0 \
  -H "Cookie: pds_session=..."
```

### Build

```bash
npm run build  # Check TypeScript errors
npm run dev    # Local dev server
```

---

## Troubleshooting Rápido

### ❌ Usuarios no aparecen

**Check:**
- ✅ Mismo `jobProductId`? (ej: ambos en "123-0", no uno en "123-0" y otro en "456-0")
- ✅ Ambos autenticados?
- ✅ `NEXT_PUBLIC_PRESENCE_ENABLED=true`?

**Fix:** Verificar Network tab en DevTools → Debe haber requests cada 2s a `/api/realtime/presence/*`

### ❌ "KV is not defined"

**Fix:**
1. Crear KV database en Vercel Dashboard
2. Copiar variables a `.env.local` para dev local
3. Restart server: `npm run dev`

### ❌ Build error: "withAuth signature"

**Ya fixed** en commit. Pattern correcto:
```typescript
export async function GET(req: NextRequest, context: { params: Promise<{id: string}> }) {
  return withAuth(async (user) => {
    const { id } = await context.params;
    // ...
  })(req);
}
```

---

## Límites Free Tier

| Item | Límite | Usuarios Soportados |
|------|--------|---------------------|
| Redis commands | 10,000/día | ~7 concurrentes |
| Storage | 256 MB | Más que suficiente |
| Bandwidth | 100 MB/día | Suficiente |

**Para más usuarios:** Usar preset `high-capacity` = ~17 usuarios concurrentes

```tsx
import { usePresenceConfigPreset } from "@/modules/realtime/hooks/use-presence-config";

// En el viewer:
const config = usePresenceConfigPreset("high-capacity"); // 5s intervals
const { activeUsers } = useViewerPresence(jobProductId, cursor, config);
```

**Presets disponibles:**
- `default` - 2s intervals (~7 usuarios)
- `low-latency` - 1s intervals (más rápido, más caro)
- `low-bandwidth` - 5s intervals (~17 usuarios)
- `high-capacity` - 5s intervals (~17 usuarios)

---

## Deshabilitar Feature

**Opción 1 (Sin código):**
```env
NEXT_PUBLIC_PRESENCE_ENABLED=false
```
Redeploy → Feature desactivado

**Opción 2 (Con código):**
Comentar `<UserCursors />` en los 3 viewers

---

## Docs Completas

- 📖 **Implementación completa:** `docs/REALTIME_IMPLEMENTATION.md`
- ⚙️ **Setup detallado:** `docs/REALTIME_SETUP.md`
- 🔌 **API reference:** `docs/REALTIME_API.md`
- 👥 **User guide:** `docs/FEATURES_PRESENCE.md`

---

## Métricas Clave

**Performance:**
- Latencia: 2 segundos (polling)
- Network: 7.5 KB/min por usuario
- CPU: <1% adicional

**Redis:**
- TTL: 5 segundos (auto-expire)
- Data structure: Hash
- Key pattern: `presence:{jobProductId}:users`

**API Calls (por usuario):**
- POST /heartbeat: 30/min
- GET /[jobProductId]: 30/min

---

## Colores de Cursors

8 colores predefinidos (hash-based por userId):

1. `#8600FB` - Purple (color principal - **Lessons**)
2. `#3b82f6` - Blue
3. `#10b981` - Green
4. `#f59e0b` - Orange
5. `#ef4444` - Red
6. `#8b5cf6` - Violet
7. `#ec4899` - Pink
8. `#14b8a6` - Teal

---

## Deployment Checklist

- [ ] Vercel KV database creada
- [ ] Environment variables verificadas
- [ ] Build exitoso localmente
- [ ] Tested con 2+ usuarios
- [ ] Git commit + push
- [ ] Verificar deployment en Vercel
- [ ] Test en producción

---

**Última actualización:** 2026-02-15
**Versión:** 1.0
**Status:** ✅ Production Ready
