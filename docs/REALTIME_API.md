# Real-Time Presence API Reference

This document describes the API endpoints for the viewer presence system.

## Overview

The presence system uses two REST API endpoints:
1. **POST /api/realtime/presence/heartbeat** - Update user presence
2. **GET /api/realtime/presence/[jobProductId]** - Fetch active users

Both endpoints require authentication and use Redis for data storage with automatic expiration.

---

## POST /api/realtime/presence/heartbeat

Updates the current user's presence in Redis. Called every 2 seconds by active viewers to maintain "online" status.

### Endpoint

```
POST /api/realtime/presence/heartbeat
```

### Authentication

Requires valid session cookie (`pds_session`). Uses `withAuth` middleware.

### Request Headers

```
Content-Type: application/json
Cookie: pds_session=<session-token>
```

### Request Body

```typescript
interface HeartbeatRequest {
  jobProductId: string;     // Format: "{jobId}-{productIndex}" (e.g., "123-0")
  cursor?: {
    lat: number;            // Latitude of cursor position
    lng: number;            // Longitude of cursor position
  } | null;
}
```

**Example:**
```json
{
  "jobProductId": "456-2",
  "cursor": {
    "lat": 27.123456,
    "lng": -81.654321
  }
}
```

### Response

```typescript
interface HeartbeatResponse {
  success: boolean;
  activeCount: number;      // Total number of active users (including self)
  error?: string;           // Present only if success: false
}
```

**Success (200):**
```json
{
  "success": true,
  "activeCount": 3
}
```

**Error (400 - Missing jobProductId):**
```json
{
  "success": false,
  "error": "Missing jobProductId"
}
```

**Error (401 - Not authenticated):**
```json
{
  "error": "Authentication required"
}
```

**Error (500 - Server error):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Redis Operations

```typescript
// Key: presence:{jobProductId}:users
// Field: user:{userId}
// Value: JSON string of PresenceUser

await kv.hset(key, {
  [`user:${userId}`]: JSON.stringify({
    userId: 123,
    name: "John Doe",
    email: "john@example.com",
    cursor: { lat: 27.123, lng: -81.654 },
    timestamp: 1709654321000
  })
});

await kv.expire(key, 5); // Auto-expire after 5 seconds
```

### cURL Example

```bash
curl -X POST http://localhost:3003/api/realtime/presence/heartbeat \
  -H "Content-Type: application/json" \
  -H "Cookie: pds_session=eyJhbGc..." \
  -d '{
    "jobProductId": "456-2",
    "cursor": {
      "lat": 27.123456,
      "lng": -81.654321
    }
  }'
```

---

## GET /api/realtime/presence/[jobProductId]

Fetches all active users currently viewing the same map. Called every 2 seconds by viewers to display other users' cursors.

### Endpoint

```
GET /api/realtime/presence/{jobProductId}
```

### Authentication

Requires valid session cookie (`pds_session`). Uses `withAuth` middleware.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobProductId` | string | Format: `{jobId}-{productIndex}` (e.g., `123-0`) |

### Request Headers

```
Cookie: pds_session=<session-token>
```

### Response

```typescript
interface PresenceUser {
  userId: number;
  name: string;
  email: string;
  cursor?: {
    lat: number;
    lng: number;
  } | null;
  timestamp: number;        // Unix timestamp in milliseconds
}

interface PresenceUsersResponse {
  success: boolean;
  data: {
    users: PresenceUser[];
  };
  error?: string;           // Present only if success: false
}
```

**Success (200) - With active users:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": 456,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "cursor": {
          "lat": 27.234567,
          "lng": -81.765432
        },
        "timestamp": 1709654325000
      },
      {
        "userId": 789,
        "name": "Bob Johnson",
        "email": "bob@example.com",
        "cursor": null,
        "timestamp": 1709654326000
      }
    ]
  }
}
```

**Success (200) - No active users:**
```json
{
  "success": true,
  "data": {
    "users": []
  }
}
```

**Error (400 - Missing jobProductId):**
```json
{
  "success": false,
  "error": "Missing jobProductId"
}
```

**Error (401 - Not authenticated):**
```json
{
  "error": "Authentication required"
}
```

**Error (500 - Server error):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Filtering Logic

The endpoint automatically filters out:
1. **Current user** - You don't see your own cursor
2. **Stale entries** - Users who haven't sent heartbeat in >5 seconds
3. **Invalid data** - Corrupted JSON entries

### Redis Operations

```typescript
// Fetch all users from Hash
const allUsersData = await kv.hgetall(`presence:${jobProductId}:users`);

// Parse and filter
const activeUsers = Object.values(allUsersData)
  .map(json => JSON.parse(json))
  .filter(user => {
    // Filter out current user
    if (user.userId === currentUserId) return false;

    // Filter out stale entries (>5s old)
    if (Date.now() - user.timestamp > 5000) return false;

    return true;
  });
```

### cURL Example

```bash
curl http://localhost:3003/api/realtime/presence/456-2 \
  -H "Cookie: pds_session=eyJhbGc..."
```

---

## Data Flow

### Typical Session

```
User opens viewer → Component mounts
  ↓
1. useCursorTracking hook starts listening to mousemove
  ↓
2. useViewerPresence hook starts intervals
  ↓
3. Every 2s: POST /heartbeat with cursor position
  ↓
4. Every 2s: GET /[jobProductId] to fetch other users
  ↓
5. UserCursors component renders cursors on map
  ↓
User closes viewer → Component unmounts
  ↓
6. Intervals cleared, no more heartbeats
  ↓
7. After 5s: Redis auto-expires user from Hash
  ↓
8. Other users stop seeing disconnected user's cursor
```

### Network Traffic

**Per user, per minute:**
- Heartbeat: 30 POST requests × ~50 bytes = 1.5 KB/min
- Poll: 30 GET requests × ~200 bytes = 6 KB/min
- **Total:** ~7.5 KB/min = 450 KB/hour

## Redis Schema

### Key Pattern

```
presence:{jobProductId}:users
```

**Examples:**
- `presence:123-0:users` - Community viewer for job 123, product 0
- `presence:456-2:users` - Construct viewer for job 456, product 2

### Data Structure

**Type:** Hash

**Fields:**
- `user:123` → JSON string of user 123's data
- `user:456` → JSON string of user 456's data
- `user:789` → JSON string of user 789's data

**Value Format:**
```json
{
  "userId": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "cursor": {
    "lat": 27.123456,
    "lng": -81.654321
  },
  "timestamp": 1709654321000
}
```

**TTL:** 5 seconds (auto-expire)

### Why Hash instead of Set?

- **Atomic updates:** `HSET` overwrites per user, not per cursor
- **Efficient queries:** `HGETALL` fetches all users in one command
- **Simple cleanup:** Single `EXPIRE` command for entire Hash
- **No duplicate handling:** Hash keys are unique by design

## Rate Limiting

### API Endpoints

Both endpoints are subject to rate limiting via `src/lib/utils/rate-limiter.ts`:

- **Limit:** TBD (check rate-limiter configuration)
- **Window:** TBD (check rate-limiter configuration)
- **Identifier:** Session ID or IP address

**Exceeding limits:**
```json
{
  "error": "Too many requests",
  "retryAfter": 60
}
```

### Redis Commands

**Free tier limit:** 10,000 commands/day

**Command breakdown per user/day:**
- Heartbeat `HSET`: 43,200 commands (30/min × 1440 min)
- Heartbeat `EXPIRE`: 43,200 commands
- Poll `HGETALL`: 43,200 commands
- **Total:** 129,600 commands/user/day

**Effective limit:** ~7 concurrent users on free tier with 2s intervals

**To reduce usage:** Increase intervals to 5s → supports ~17 concurrent users

## Error Handling

### Client-Side Retry Logic

The `useViewerPresence` hook includes automatic retry:
```typescript
try {
  await fetch('/api/realtime/presence/heartbeat', { ... });
  setIsConnected(true);
} catch (err) {
  setIsConnected(false);
  // Will retry on next interval (2s later)
}
```

### Server-Side Errors

All errors are logged with context:
```typescript
console.error('[Presence Heartbeat] Error:', error);
console.error('[Presence Fetch] Error:', error);
```

Check server logs for debugging.

## Security

### Authentication

- All endpoints require `withAuth` middleware
- Session must be valid and not expired
- No anonymous access

### Authorization

- Users can only see presence for jobs they have access to
- No explicit permission check (presence is informational)
- Rate limiting prevents abuse

### Data Privacy

- No persistent history of user activity
- Data expires automatically after 5 seconds
- Only basic user info exposed (name, email already in session)
- Cursor positions are ephemeral (not logged)

## Testing

### Unit Tests

Test heartbeat endpoint:
```bash
npm test src/app/api/realtime/presence/heartbeat/route.test.ts
```

Test fetch endpoint:
```bash
npm test src/app/api/realtime/presence/[jobProductId]/route.test.ts
```

### Integration Tests

Two-browser test:
1. Open viewer in Browser A (logged in as User A)
2. Open same viewer in Browser B (logged in as User B)
3. Verify User A sees User B's cursor
4. Verify User B sees User A's cursor
5. Close Browser A
6. Verify User B stops seeing User A after ~5 seconds

### Performance Tests

Load test with k6:
```javascript
import http from 'k6/http';

export default function () {
  const heartbeat = http.post(
    'http://localhost:3003/api/realtime/presence/heartbeat',
    JSON.stringify({ jobProductId: '123-0', cursor: { lat: 27, lng: -81 } }),
    { headers: { 'Content-Type': 'application/json', 'Cookie': 'pds_session=...' } }
  );

  const fetch = http.get(
    'http://localhost:3003/api/realtime/presence/123-0',
    { headers: { 'Cookie': 'pds_session=...' } }
  );
}
```

---

## See Also

- [REALTIME_SETUP.md](./REALTIME_SETUP.md) - Setup guide
- [FEATURES_PRESENCE.md](./FEATURES_PRESENCE.md) - User guide
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Redis Docs](https://upstash.com/docs/redis)
