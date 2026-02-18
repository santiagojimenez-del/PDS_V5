# 🎫 Pilot Scheduling System - Technical Documentation

## Overview

The Pilot Scheduling System provides intelligent pilot assignment and workload management for the ProDrones Hub platform. It includes availability tracking, conflict detection, smart assignment suggestions, and automated notifications.

**Current Status:** Phase 2 Complete (70%)
**Version:** 2.0.0
**Last Updated:** February 17, 2026

---

## 🏗️ Architecture

### Database Schema

The scheduling system consists of two core tables:

#### 1. Pilot Availability Table
Stores weekly recurring availability schedules for each pilot.

```typescript
{
  id: number (PK)
  userId: number (FK → Users)
  dayOfWeek: number (0-6, 0=Sunday)
  startTime: time (HH:MM:SS)
  endTime: time (HH:MM:SS)
  isActive: boolean
  createdAt: datetime
  updatedAt: datetime
}
```

**Example:**
- Pilot available Monday 9am-5pm
- Stored as: `dayOfWeek=1, startTime='09:00:00', endTime='17:00:00'`

#### 2. Pilot Blackout Table
Stores specific unavailable date ranges (vacation, PTO, personal time).

```typescript
{
  id: number (PK)
  userId: number (FK → Users)
  startDate: date
  endDate: date
  reason: string
  createdAt: datetime
}
```

**Example:**
- Pilot on vacation Feb 20-25
- Stored as: `startDate='2026-02-20', endDate='2026-02-25', reason='Vacation'`

### Relationships

```
Users (1) ──→ (N) PilotAvailability
Users (1) ──→ (N) PilotBlackout
Jobs (1) ──→ (N) Users (via personsAssigned array)
```

---

## 🔧 Core Services

### Conflict Detection Service (`src/modules/scheduling/services/conflict-detector.ts`)

#### Main Conflict Check

Detects all scheduling conflicts for a pilot on a specific date:

```typescript
detectScheduleConflicts(
  pilotId: number,
  scheduledDate: string,
  durationHours: number = 4
): Promise<ConflictReport>
```

**Checks:**
1. **Weekly Availability** - Is pilot available on this day of week?
2. **Blackout Periods** - Is date within a blackout range?
3. **Existing Jobs** - Does pilot have overlapping job assignments?
4. **Workload Limits** - Has pilot exceeded max jobs per week/month?

**Returns:**
```typescript
{
  hasConflicts: boolean,
  conflicts: Array<{
    type: "availability" | "blackout" | "double_booking" | "workload_limit",
    severity: "error" | "warning",
    message: string,
    details: object
  }>
}
```

**Severity Levels:**
- **Error:** Hard conflicts (blackout, double booking) - should not schedule
- **Warning:** Soft conflicts (high workload, no availability set) - can schedule with caution

#### Example Conflict Report

```json
{
  "hasConflicts": true,
  "conflicts": [
    {
      "type": "blackout",
      "severity": "error",
      "message": "Pilot is on vacation (Vacation)",
      "details": {
        "startDate": "2026-02-20",
        "endDate": "2026-02-25",
        "reason": "Vacation"
      }
    },
    {
      "type": "workload_limit",
      "severity": "warning",
      "message": "Pilot has 4 jobs this week (approaching limit)",
      "details": {
        "weekJobCount": 4,
        "monthJobCount": 12
      }
    }
  ]
}
```

---

### Assignment Optimizer Service (`src/modules/scheduling/services/assignment-optimizer.ts`)

#### Smart Pilot Suggestions

Analyzes all pilots and suggests the best candidates for a job:

```typescript
suggestOptimalPilots(
  scheduledDate: string,
  requiredCount: number = 1,
  durationHours: number = 4
): Promise<PilotSuggestion[]>
```

**Scoring Algorithm (0-100 scale):**

```
Base Score: 100

Penalties:
- Error conflict (blackout, double booking): -50
- Warning conflict (workload, no availability): -20

Bonuses:
- Available all week (0 jobs): +10
- Light workload (1-2 jobs): +5
```

**Returns:**
```typescript
{
  pilotId: number,
  pilotName: string,
  score: number,        // 0-100
  reasons: string[],    // Human-readable explanations
  conflicts: Conflict[] // Detailed conflict list
}[]
```

**Sorted:** Highest score first, returns top N*2 suggestions (min 5)

#### Example Suggestions

```json
[
  {
    "pilotId": 15,
    "pilotName": "John Smith",
    "score": 110,
    "reasons": [
      "💡 Available all week",
      "✅ No conflicts detected"
    ],
    "conflicts": []
  },
  {
    "pilotId": 22,
    "pilotName": "Sarah Johnson",
    "score": 80,
    "reasons": [
      "⚡ Pilot has 3 jobs this week (moderate workload)",
      "✅ Available on requested date"
    ],
    "conflicts": [...]
  },
  {
    "pilotId": 8,
    "pilotName": "Mike Wilson",
    "score": 30,
    "reasons": [
      "⚠️ Pilot is on vacation (PTO)",
      "❌ Cannot be scheduled"
    ],
    "conflicts": [...]
  }
]
```

---

## 🌐 API Endpoints

### Availability Management

#### `GET /api/scheduling/pilots/[id]/availability`
Get all weekly availability schedules for a pilot.

**Response:**
```json
{
  "success": true,
  "data": {
    "availability": [
      {
        "id": 1,
        "userId": 15,
        "dayOfWeek": 1,
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "isActive": true
      },
      {
        "id": 2,
        "userId": 15,
        "dayOfWeek": 2,
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "isActive": true
      }
    ]
  }
}
```

---

#### `POST /api/scheduling/pilots/[id]/availability`
Add or update weekly availability (supports bulk updates).

**Request Body (Single):**
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Request Body (Bulk):**
```json
{
  "schedules": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 3, "startTime": "09:00", "endTime": "17:00" }
  ]
}
```

**Logic:**
- Deletes existing availability for pilot
- Inserts new schedules
- Supports atomic updates (all or nothing)

---

#### `DELETE /api/scheduling/pilots/[id]/availability`
Clear all availability for a pilot.

**Response:**
```json
{
  "success": true,
  "data": { "message": "Availability cleared" }
}
```

---

### Blackout Management

#### `GET /api/scheduling/pilots/[id]/blackout`
Get all blackout periods for a pilot.

**Response:**
```json
{
  "success": true,
  "data": {
    "blackouts": [
      {
        "id": 5,
        "userId": 15,
        "startDate": "2026-02-20",
        "endDate": "2026-02-25",
        "reason": "Vacation",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

#### `POST /api/scheduling/pilots/[id]/blackout`
Add a blackout period.

**Request Body:**
```json
{
  "startDate": "2026-02-20",
  "endDate": "2026-02-25",
  "reason": "Vacation"
}
```

**Validation:**
- `endDate` must be >= `startDate`
- Dates must be valid ISO format

---

#### `DELETE /api/scheduling/pilots/[id]/blackout/[blackoutId]`
Remove a specific blackout period.

**Response:**
```json
{
  "success": true,
  "data": { "deleted": 5 }
}
```

---

### Conflict Detection

#### `POST /api/scheduling/conflicts`
Check for conflicts before scheduling a pilot.

**Request Body:**
```json
{
  "pilotId": 15,
  "scheduledDate": "2026-02-20",
  "durationHours": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasConflicts": true,
    "conflicts": [
      {
        "type": "blackout",
        "severity": "error",
        "message": "Pilot is on vacation (Vacation)",
        "details": {
          "startDate": "2026-02-20",
          "endDate": "2026-02-25",
          "reason": "Vacation"
        }
      }
    ]
  }
}
```

---

### Smart Suggestions

#### `POST /api/scheduling/suggest`
Get pilot suggestions for a job.

**Request Body:**
```json
{
  "scheduledDate": "2026-02-20",
  "requiredCount": 2,
  "durationHours": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "pilotId": 15,
        "pilotName": "John Smith",
        "score": 110,
        "reasons": ["💡 Available all week", "✅ No conflicts"],
        "conflicts": []
      },
      {
        "pilotId": 22,
        "pilotName": "Sarah Johnson",
        "score": 85,
        "reasons": ["✅ Available on requested date"],
        "conflicts": []
      }
    ]
  }
}
```

---

## 🎨 User Interface

### Pilot List Page (`/hub/scheduling/pilots`)
- List all pilots and staff
- Quick stats (total pilots, active, staff)
- Navigation to individual pilot schedules

### Pilot Schedule Page (`/hub/scheduling/pilots/[id]`)

**Components:**
1. **Pilot Availability Manager**
   - Weekly schedule grid (Monday-Sunday)
   - Add/edit availability slots
   - Quick action buttons (Full-time, Part-time, Clear all)
   - Visual active/inactive indicators

2. **Pilot Blackout Manager**
   - List of blackout periods
   - Add new blackout form (date range + reason)
   - Delete blackout button
   - Color-coded dates

3. **Pilot Schedule Calendar**
   - Weekly calendar view
   - Shows assigned jobs per day
   - Free/busy indicators
   - Week summary with job count

### Scheduling Dashboard (`/hub/scheduling`)
- Quick stats (pilots, staff, weekly jobs)
- Quick action cards (view pilots, add availability, check conflicts)
- Team overview with links to pilot schedules
- Current week header

### Job Scheduling Dialog (with Smart Suggestions)

**Components:**
1. **Pilot Suggestion List**
   - Shows top suggested pilots
   - Score badges (color-coded by score)
   - Conflict indicators (⚠️ warnings, ❌ errors)
   - Reasons list for each pilot
   - Clickable selection (disabled for error conflicts)

**Score Color Coding:**
- 🟢 **80-100** - Green (Excellent)
- 🟡 **50-79** - Yellow (Good)
- 🔴 **0-49** - Red (Poor/Conflicts)

---

## 🔐 Security & Permissions

### Authentication
All scheduling endpoints require authentication via `withAuth` middleware.

### Authorization
- Admins can manage all pilot schedules
- Future: Pilots can manage their own availability
- Future: Managers can view but not edit

---

## 📊 Business Logic & Workflows

### Availability Workflow

```
1. Admin opens pilot schedule page
2. Admin sets weekly availability (e.g., Mon-Fri 9am-5pm)
3. System stores recurring schedule
4. Admin adds blackout for vacation (Feb 20-25)
5. When scheduling job on Feb 22:
   - Conflict detector finds blackout
   - Pilot shown with low score (30) and error indicator
   - Admin cannot select this pilot
```

### Assignment Workflow

```
1. Manager schedules job for Feb 20
2. System suggests pilots:
   - Pilot A: Score 110 (available, light workload)
   - Pilot B: Score 85 (available, moderate workload)
   - Pilot C: Score 30 (on vacation - ERROR)
3. Manager selects Pilot A
4. System records assignment
5. Email sent to Pilot A with job details
6. Job appears on Pilot A's calendar
```

### Conflict Resolution

**Error Conflicts (Cannot Schedule):**
- Pilot on blackout/vacation
- Double booking (already assigned to overlapping job)

**Warning Conflicts (Can Schedule with Caution):**
- High workload (approaching limits)
- No availability set for day of week
- Overtime (working beyond normal hours)

---

## 🚀 Future Enhancements

### Phase 3 (Planned)

#### Pilot Self-Service Dashboard
- Pilots can view their own schedule
- Request time off (blackout dates)
- View upcoming job assignments
- Update personal availability preferences

#### Advanced Calendar Views
- Multi-week calendar display
- Month view with job density heatmap
- Drag-and-drop job reassignment
- Conflict highlighting in calendar

#### Capacity Planning
- Forecast pilot capacity for upcoming months
- Identify understaffed periods
- Suggest hiring needs based on job pipeline

#### Mobile Optimization
- Responsive calendar for mobile devices
- Touch-friendly availability editing
- Push notifications for new assignments

---

## 📋 Testing Checklist

### Availability Management
- [ ] Add weekly availability for pilot
- [ ] Update existing availability
- [ ] Clear all availability
- [ ] Bulk update availability (Mon-Fri)
- [ ] Handle overlapping time slots
- [ ] Validate time format (HH:MM)

### Blackout Management
- [ ] Add blackout period
- [ ] Delete blackout period
- [ ] Validate date ranges
- [ ] Handle overlapping blackouts
- [ ] Display blackouts in calendar

### Conflict Detection
- [ ] Detect blackout conflicts
- [ ] Detect double booking
- [ ] Detect workload limits
- [ ] Detect missing availability
- [ ] Severity levels correct (error vs warning)

### Smart Suggestions
- [ ] Score pilots correctly (0-100)
- [ ] Sort by score (highest first)
- [ ] Return correct number of suggestions
- [ ] Include conflict details
- [ ] Generate helpful reason messages

### Email Notifications
- [ ] Send email on job assignment
- [ ] Include correct job details
- [ ] Send to all assigned pilots
- [ ] Handle missing email gracefully

---

## 📁 File Structure

```
src/
├── lib/db/schema/
│   └── pilot-availability.ts          # Database schema (2 tables)
│
├── modules/scheduling/
│   ├── types.ts                       # TypeScript interfaces
│   ├── schemas/
│   │   └── scheduling-schemas.ts      # Zod validation
│   ├── services/
│   │   ├── conflict-detector.ts       # Conflict detection (260+ lines)
│   │   └── assignment-optimizer.ts    # Smart suggestions (150+ lines)
│   └── components/
│       ├── pilot-availability-manager.tsx
│       ├── pilot-blackout-manager.tsx
│       ├── pilot-schedule-calendar.tsx
│       └── pilot-suggestion-list.tsx
│
└── app/
    ├── api/scheduling/
    │   ├── pilots/[id]/
    │   │   ├── availability/route.ts
    │   │   └── blackout/route.ts
    │   ├── conflicts/route.ts
    │   └── suggest/route.ts
    │
    └── hub/scheduling/
        ├── page.tsx                   # Dashboard
        ├── pilots/
        │   ├── page.tsx              # Pilot list
        │   └── [id]/page.tsx         # Individual pilot schedule
        └── ... (future pages)
```

---

## 🔗 Related Systems

### Integration Points

**Jobs System:**
- Job assignments reference users (pilots/staff)
- Scheduled date drives conflict detection
- Job count affects workload calculations

**Email System:**
- Sends pilot notifications on assignment
- Uses pilot-notification template
- Includes job details and schedule info

**User System:**
- Availability/blackouts tied to user ID
- Role filtering (Pilot, Staff)
- User metadata in suggestions

---

## 📝 Database Indexes

**Performance Optimizations:**
```sql
-- PilotAvailability table
INDEX idx_user_id ON Pilot_Availability(user_id)
INDEX idx_day_of_week ON Pilot_Availability(day_of_week)
INDEX idx_active ON Pilot_Availability(is_active)

-- PilotBlackout table
INDEX idx_user_id ON Pilot_Blackout(user_id)
INDEX idx_date_range ON Pilot_Blackout(start_date, end_date)
```

---

**Version:** 2.0.0 (Phase 2 Complete)
**Status:** 70% Complete
**Last Updated:** February 17, 2026
**Next Review:** February 24, 2026
