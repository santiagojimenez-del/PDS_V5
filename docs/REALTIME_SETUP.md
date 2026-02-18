# Vercel KV Setup Guide

This guide explains how to set up Vercel KV (Redis) for the real-time presence feature in ProDrones Hub.

## Overview

The viewer presence system uses **Vercel KV** (a managed Redis service) to track active users in map viewers. This enables:
- Showing who else is viewing the same map
- Displaying cursor positions of other users in real-time
- Automatic cleanup of stale/disconnected users

**Note:** Vercel KV has been migrated to Upstash Redis integration, but the `@vercel/kv` package remains compatible.

## Prerequisites

- Vercel account with project deployed
- Access to Vercel Dashboard
- Local development environment (optional, for testing)

## Production Setup (5 minutes)

### Step 1: Create KV Database

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project: **ProDrones Hub**
3. Click on the **Storage** tab in the top navigation
4. Click **Create Database** button
5. Select **KV (Redis)** from the storage options
6. Configure the database:
   - **Name:** `prodrones-presence` (or any descriptive name)
   - **Region:** `us-east-1` (or closest to your users)
   - **Plan:** Free tier (256MB storage, 10K commands/day)
7. Click **Create**

### Step 2: Verify Environment Variables

After creating the database, Vercel automatically injects these environment variables into your project:

```env
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

To verify:
1. Go to **Settings** → **Environment Variables**
2. Confirm the KV variables are present
3. They should be enabled for **Production**, **Preview**, and **Development** environments

### Step 3: Deploy

The feature is now enabled! Your next deployment will include real-time presence.

```bash
git push origin master
```

Vercel will automatically use the KV environment variables.

## Local Development Setup

To test the presence feature locally, you need to copy the KV credentials to your local `.env.local` file.

### Step 1: Get Credentials

1. In Vercel Dashboard → **Storage** → Select your KV database
2. Click on the **`.env.local` tab**
3. Copy all the environment variables shown

### Step 2: Update Local Environment

Create or update `.env.local` in your project root:

```bash
# Vercel KV (Redis) - For local development
KV_URL="redis://default:..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."

# Feature toggle (optional)
NEXT_PUBLIC_PRESENCE_ENABLED=true
```

**Important:** Never commit `.env.local` to Git! It's already in `.gitignore`.

### Step 3: Restart Development Server

```bash
npm run dev
```

The presence feature will now work locally, using the production KV database.

## Troubleshooting

### Issue: "KV is not defined" error

**Solution:** Ensure environment variables are set correctly. Restart your development server after updating `.env.local`.

### Issue: Users not appearing in presence list

**Possible causes:**
1. **Different `jobProductId`:** Users must be viewing the exact same job-product combination
2. **Feature disabled:** Check `NEXT_PUBLIC_PRESENCE_ENABLED` is `true`
3. **Authentication:** Users must be logged in (presence requires authenticated sessions)
4. **Firewall/Network:** Check if API requests to `/api/realtime/presence/*` are blocked

**Debug steps:**
```bash
# Check heartbeat is working
curl -X POST http://localhost:3003/api/realtime/presence/heartbeat \
  -H "Content-Type: application/json" \
  -H "Cookie: pds_session=YOUR_SESSION_COOKIE" \
  -d '{"jobProductId":"123-0","cursor":{"lat":27.1,"lng":-81.2}}'

# Check fetch is working
curl http://localhost:3003/api/realtime/presence/123-0 \
  -H "Cookie: pds_session=YOUR_SESSION_COOKIE"
```

### Issue: High Redis command usage

**Free tier limit:** 10,000 commands/day ≈ 7 concurrent users continuously active

**Solutions:**
1. **Reduce polling frequency:** Edit `src/modules/realtime/hooks/use-viewer-presence.ts`:
   ```typescript
   heartbeatInterval: 5000, // Change from 2000 to 5000 (5 seconds)
   pollInterval: 5000,       // Change from 2000 to 5000 (5 seconds)
   ```
   This reduces usage by 60% → supports ~17 concurrent users

2. **Upgrade to Pro plan:** $10/month → 1M commands/day → supports 700+ concurrent users

3. **Disable for specific environments:**
   ```env
   NEXT_PUBLIC_PRESENCE_ENABLED=false  # Disable in preview deployments
   ```

### Issue: Stale users not disappearing

**Expected behavior:** Users should disappear 5 seconds after disconnecting

**If not working:**
1. Check Redis TTL is set correctly (check backend logs)
2. Verify polling interval is running (check browser Network tab)
3. Ensure system clock is synchronized (time drift can cause issues)

## Monitoring

### Check Redis Usage

1. Vercel Dashboard → **Storage** → Select KV database
2. View metrics:
   - **Storage used:** Should stay under 256 MB (free tier)
   - **Commands/day:** Should stay under 10,000 (free tier)
   - **Active connections:** Real-time connection count

### Check Presence in Browser

Open browser console in a viewer page:
```javascript
// Check active users
fetch('/api/realtime/presence/123-0')
  .then(r => r.json())
  .then(console.log)

// Send test heartbeat
fetch('/api/realtime/presence/heartbeat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobProductId: '123-0', cursor: { lat: 27, lng: -81 } })
}).then(r => r.json()).then(console.log)
```

## Free Tier Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Storage | 256 MB | More than enough for presence (uses ~1KB per user) |
| Commands | 10,000/day | ~7 concurrent users with 2s intervals |
| Bandwidth | 100 MB/day | Sufficient for presence data |
| Databases | 1 | One KV database per project on free tier |

## Security

- **Authentication required:** All endpoints use `withAuth` middleware
- **No persistent history:** Presence data expires after 5 seconds
- **User isolation:** Users only see others in the same job-product viewer
- **No PII stored:** Only userId, name, email (already in session)

## Next Steps

- See [REALTIME_API.md](./REALTIME_API.md) for API reference
- See [FEATURES_PRESENCE.md](./FEATURES_PRESENCE.md) for user guide
- Check [Rate Limiting](../src/lib/utils/rate-limiter.ts) for API protection

## Support

- **Vercel KV Docs:** https://vercel.com/docs/storage/vercel-kv
- **Upstash Redis:** https://upstash.com/docs/redis
- **ProDrones Issues:** https://github.com/prodrones/hub/issues
