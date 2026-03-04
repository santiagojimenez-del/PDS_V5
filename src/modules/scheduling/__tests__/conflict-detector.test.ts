import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectScheduleConflicts,
  isAvailable,
  getPilotAssignments,
} from "../services/conflict-detector";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const dbSelectMock = vi.hoisted(() => vi.fn());
const mockGetMetaValue = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: { select: dbSelectMock },
}));

vi.mock("@/lib/db/schema", () => ({
  pilotAvailability: {},
  pilotBlackout:     {},
  jobs:              {},
  jobMeta:           {},
}));

vi.mock("@/lib/db/helpers", () => ({
  getMetaValue: mockGetMetaValue,
}));

vi.mock("drizzle-orm", () => ({
  eq:    vi.fn((_c: unknown, _v: unknown) => ({ eq: [_c, _v] })),
  and:   vi.fn((...a: unknown[]) => ({ and: a })),
  lte:   vi.fn((_c: unknown, _v: unknown) => ({ lte: [_c, _v] })),
  gte:   vi.fn((_c: unknown, _v: unknown) => ({ gte: [_c, _v] })),
  sql:   vi.fn(() => ({})),
  count: vi.fn(() => ({})),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function makeQuery(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  for (const m of [
    "from", "where", "orderBy", "set", "values", "limit", "offset", "leftJoin",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then    = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(rows).then(res, rej);
  chain.catch   = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);
  chain.finally = (cb: () => void) => Promise.resolve(rows).finally(cb);
  return chain;
}

// Shorthand: queue N empty DB returns (for calls we don't care about asserting)
function queueEmpty(n: number) {
  for (let i = 0; i < n; i++) dbSelectMock.mockReturnValueOnce(makeQuery([]));
}

// ── detectScheduleConflicts() ─────────────────────────────────────────────────

describe("detectScheduleConflicts()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // By default: no max jobs limits
    mockGetMetaValue.mockResolvedValue(null);
  });

  it("returns no conflicts when pilot has no schedule configured and no blackouts", async () => {
    // 1. availability count → 0  (no schedule configured)
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 0 }]));
    // 2. blackouts → []
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    // 3. existing jobs → []
    dbSelectMock.mockReturnValueOnce(makeQuery([]));

    const result = await detectScheduleConflicts(10, "2030-06-15", 4);

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
    expect(result.canSchedule).toBe(true);
  });

  it("adds 'unavailable' conflict when pilot has schedule but not for this day", async () => {
    // 1. availability count → 1  (schedule IS configured)
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 1 }]));
    // 2. availability for this day → [] (not configured for Sunday = 0)
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    // 3. blackouts → []
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    // 4. existing jobs → []
    dbSelectMock.mockReturnValueOnce(makeQuery([]));

    const result = await detectScheduleConflicts(10, "2030-06-15"); // Sunday

    const unavailable = result.conflicts.find((c) => c.type === "unavailable");
    expect(unavailable).toBeDefined();
    expect(unavailable!.severity).toBe("error");
  });

  it("adds 'unavailable' conflict when pilot's availability record says isAvailable=false", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 1 }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([{ isAvailable: 0, dayOfWeek: 0 }]));
    queueEmpty(2); // blackouts + existing jobs

    const result = await detectScheduleConflicts(10, "2030-06-15");

    expect(result.conflicts.some((c) => c.type === "unavailable")).toBe(true);
    expect(result.canSchedule).toBe(false);
  });

  it("does NOT add unavailable conflict when pilot is marked available for the day", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 1 }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([{ isAvailable: 1, dayOfWeek: 1 }]));
    queueEmpty(2);

    const result = await detectScheduleConflicts(10, "2030-06-16"); // Monday

    expect(result.conflicts.some((c) => c.type === "unavailable")).toBe(false);
  });

  it("adds 'blackout' conflict when a blackout period covers the date", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 0 }]));
    dbSelectMock.mockReturnValueOnce(
      makeQuery([{ id: 1, pilotId: 10, startDate: new Date("2030-06-01"), endDate: new Date("2030-06-30"), reason: "Vacation" }])
    );
    dbSelectMock.mockReturnValueOnce(makeQuery([]));

    const result = await detectScheduleConflicts(10, "2030-06-15");

    const blackout = result.conflicts.find((c) => c.type === "blackout");
    expect(blackout).toBeDefined();
    expect(blackout!.severity).toBe("error");
    expect(blackout!.message).toContain("Vacation");
  });

  it("adds 'double_booking' conflict when pilot is already assigned that day", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 0 }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([])); // no blackout
    dbSelectMock.mockReturnValueOnce(makeQuery([
      {
        jobId: 42,
        jobName: "Existing Job",
        dates: { scheduled: "2030-06-15" },
        personsAssigned: JSON.stringify([10, 11]),
      },
    ]));

    const result = await detectScheduleConflicts(10, "2030-06-15");

    const booking = result.conflicts.find((c) => c.type === "double_booking");
    expect(booking).toBeDefined();
    expect(booking!.severity).toBe("error");
    expect(result.canSchedule).toBe(false);
  });

  it("does NOT add double_booking when pilot is NOT in the personsAssigned list", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 0 }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    dbSelectMock.mockReturnValueOnce(makeQuery([
      {
        jobId: 42,
        jobName: "Other Job",
        dates: { scheduled: "2030-06-15" },
        personsAssigned: JSON.stringify([99, 88]), // different pilots
      },
    ]));

    const result = await detectScheduleConflicts(10, "2030-06-15");

    expect(result.conflicts.some((c) => c.type === "double_booking")).toBe(false);
  });

  it("adds 'job_limit_exceeded' warning when weekly limit is reached", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 0 }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([])); // no blackout
    dbSelectMock.mockReturnValueOnce(makeQuery([])); // no double-booking
    // week job count query
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { jobId: 1, personsAssigned: JSON.stringify([10]) },
      { jobId: 2, personsAssigned: JSON.stringify([10]) },
      { jobId: 3, personsAssigned: JSON.stringify([10]) },
    ]));

    mockGetMetaValue
      .mockResolvedValueOnce("3")   // max_jobs_per_week = 3
      .mockResolvedValueOnce(null); // max_jobs_per_month = null

    const result = await detectScheduleConflicts(10, "2030-06-15");

    const limitConflict = result.conflicts.find((c) => c.type === "job_limit_exceeded");
    expect(limitConflict).toBeDefined();
    expect(limitConflict!.severity).toBe("warning");
    // Warning doesn't block scheduling
    expect(result.canSchedule).toBe(true);
  });

  it("returns canSchedule=false only when there are error-severity conflicts", async () => {
    // Blackout → error → canSchedule false
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 0 }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([{ id: 1, reason: "Holiday" }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([]));

    const result = await detectScheduleConflicts(10, "2030-06-15");
    expect(result.canSchedule).toBe(false);
  });

  it("returns canSchedule=true when only warning conflicts exist", async () => {
    // Only weekly limit warning — no errors
    dbSelectMock.mockReturnValueOnce(makeQuery([{ total: 0 }]));
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { jobId: 5, personsAssigned: JSON.stringify([10]) },
    ]));
    mockGetMetaValue
      .mockResolvedValueOnce("1")   // max=1, count=1 → warning
      .mockResolvedValueOnce(null);

    const result = await detectScheduleConflicts(10, "2030-06-15");
    expect(result.canSchedule).toBe(true);
    expect(result.hasConflicts).toBe(true);
  });
});

// ── isAvailable() ─────────────────────────────────────────────────────────────

describe("isAvailable()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when there are no blackout periods", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    const result = await isAvailable(10, new Date("2030-06-01"), new Date("2030-06-07"));
    expect(result).toBe(true);
  });

  it("returns false when a blackout period overlaps the range", async () => {
    dbSelectMock.mockReturnValueOnce(
      makeQuery([{ id: 1, pilotId: 10, startDate: new Date("2030-05-30"), endDate: new Date("2030-06-05"), reason: "Holiday" }])
    );
    const result = await isAvailable(10, new Date("2030-06-01"), new Date("2030-06-07"));
    expect(result).toBe(false);
  });
});

// ── getPilotAssignments() ─────────────────────────────────────────────────────

describe("getPilotAssignments()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an empty array when there are no jobs in the range", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    const result = await getPilotAssignments(10, new Date("2030-06-01"), new Date("2030-06-30"));
    expect(result).toEqual([]);
  });

  it("includes jobs where the pilot is in personsAssigned", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      {
        jobId: 7,
        jobName: "Survey Job",
        dates: { scheduled: "2030-06-10" },
        personsAssigned: JSON.stringify([10, 11]),
      },
    ]));

    const result = await getPilotAssignments(10, new Date("2030-06-01"), new Date("2030-06-30"));
    expect(result).toHaveLength(1);
    expect(result[0].jobId).toBe(7);
    expect(result[0].scheduledDate).toBe("2030-06-10");
  });

  it("excludes jobs where the pilot is NOT in personsAssigned", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      {
        jobId: 8,
        jobName: "Other Job",
        dates: { scheduled: "2030-06-10" },
        personsAssigned: JSON.stringify([99]),
      },
    ]));

    const result = await getPilotAssignments(10, new Date("2030-06-01"), new Date("2030-06-30"));
    expect(result).toHaveLength(0);
  });

  it("handles invalid personsAssigned JSON gracefully (skips the row)", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      {
        jobId: 9,
        jobName: "Broken Job",
        dates: { scheduled: "2030-06-10" },
        personsAssigned: "INVALID_JSON",
      },
    ]));

    const result = await getPilotAssignments(10, new Date("2030-06-01"), new Date("2030-06-30"));
    expect(result).toHaveLength(0);
  });

  it("returns multiple assignments when pilot appears in several jobs", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { jobId: 1, jobName: "Job A", dates: { scheduled: "2030-06-05" }, personsAssigned: JSON.stringify([10]) },
      { jobId: 2, jobName: "Job B", dates: { scheduled: "2030-06-12" }, personsAssigned: JSON.stringify([10, 12]) },
      { jobId: 3, jobName: "Job C", dates: { scheduled: "2030-06-20" }, personsAssigned: JSON.stringify([99]) }, // not our pilot
    ]));

    const result = await getPilotAssignments(10, new Date("2030-06-01"), new Date("2030-06-30"));
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.jobId)).toEqual([1, 2]);
  });
});
