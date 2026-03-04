import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createNotification,
  createNotifications,
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../notification-service";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const dbInsertMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: { insert: dbInsertMock, select: dbSelectMock, update: dbUpdateMock },
}));

vi.mock("@/lib/db/schema", () => ({ notifications: {} }));

vi.mock("drizzle-orm", () => ({
  eq:   vi.fn((_c: unknown, _v: unknown) => ({ _c, _v })),
  and:  vi.fn((...a: unknown[]) => a),
  desc: vi.fn((c: unknown) => c),
  sql:  vi.fn(() => ({})),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Chainable AND awaitable mock — resolves to `rows` at any await point */
function makeQuery(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  for (const m of ["from", "where", "orderBy", "set", "values", "limit", "offset"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then    = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(rows).then(res, rej);
  chain.catch   = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);
  chain.finally = (cb: () => void) => Promise.resolve(rows).finally(cb);
  return chain;
}

// ── createNotification() ──────────────────────────────────────────────────────

describe("createNotification()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts a notification row with the correct fields", async () => {
    const chain = makeQuery();
    dbInsertMock.mockReturnValueOnce(chain);

    await createNotification({
      userId: 5,
      type: "job_approved",
      title: "Job approved",
      message: "Your job was approved",
      link: "/jobs/1",
    });

    expect(dbInsertMock).toHaveBeenCalledOnce();
    expect((chain.values as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        type: "job_approved",
        title: "Job approved",
        message: "Your job was approved",
        link: "/jobs/1",
        isRead: 0,
      })
    );
  });

  it("sets message and link to null when not provided", async () => {
    const chain = makeQuery();
    dbInsertMock.mockReturnValueOnce(chain);

    await createNotification({ userId: 1, type: "general", title: "Hello" });

    expect((chain.values as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      expect.objectContaining({ message: null, link: null })
    );
  });

  it("does not throw when the DB insert fails (fire-and-forget)", async () => {
    const chain = makeQuery();
    (chain.values as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("DB down"));
    dbInsertMock.mockReturnValueOnce(chain);

    // Should resolve without throwing
    await expect(
      createNotification({ userId: 1, type: "general", title: "Fail silently" })
    ).resolves.toBeUndefined();
  });
});

// ── createNotifications() ─────────────────────────────────────────────────────

describe("createNotifications()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when userIds array is empty", async () => {
    await createNotifications([], { type: "general", title: "Ignored" });
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it("inserts one row per userId", async () => {
    const chain = makeQuery();
    dbInsertMock.mockReturnValueOnce(chain);

    await createNotifications([1, 2, 3], { type: "job_delivered", title: "Delivery done" });

    const valuesCalls = (chain.values as ReturnType<typeof vi.fn>).mock.calls[0][0] as unknown[];
    expect(valuesCalls).toHaveLength(3);
    expect(valuesCalls[0]).toMatchObject({ userId: 1, isRead: 0 });
    expect(valuesCalls[1]).toMatchObject({ userId: 2, isRead: 0 });
    expect(valuesCalls[2]).toMatchObject({ userId: 3, isRead: 0 });
  });

  it("does not throw when the bulk insert fails", async () => {
    const chain = makeQuery();
    (chain.values as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Bulk fail"));
    dbInsertMock.mockReturnValueOnce(chain);

    await expect(
      createNotifications([1], { type: "general", title: "Bulk fail" })
    ).resolves.toBeUndefined();
  });
});

// ── getNotificationsForUser() ─────────────────────────────────────────────────

describe("getNotificationsForUser()", () => {
  beforeEach(() => vi.clearAllMocks());

  const SAMPLE_ROWS = [
    { id: 10, userId: 5, type: "job_approved", title: "Approved", isRead: 0 },
    { id: 11, userId: 5, type: "general",      title: "Hello",    isRead: 1 },
  ];

  it("returns the rows from the database", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery(SAMPLE_ROWS));
    const result = await getNotificationsForUser(5);
    expect(result).toEqual(SAMPLE_ROWS);
  });

  it("returns an empty array when the user has no notifications", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    const result = await getNotificationsForUser(99);
    expect(result).toEqual([]);
  });

  it("passes limit and offset to the query chain", async () => {
    const chain = makeQuery([]);
    dbSelectMock.mockReturnValueOnce(chain);

    await getNotificationsForUser(5, 10, 20);

    expect((chain.limit as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(10);
    expect((chain.offset as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(20);
  });
});

// ── getUnreadCount() ──────────────────────────────────────────────────────────

describe("getUnreadCount()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the count value from the database", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ count: 7 }]));
    const count = await getUnreadCount(5);
    expect(count).toBe(7);
  });

  it("returns 0 when there are no unread notifications", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([{ count: 0 }]));
    const count = await getUnreadCount(5);
    expect(count).toBe(0);
  });

  it("returns 0 when the query returns an empty result", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    const count = await getUnreadCount(5);
    expect(count).toBe(0);
  });
});

// ── markAsRead() ──────────────────────────────────────────────────────────────

describe("markAsRead()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the notification to isRead=1", async () => {
    const chain = makeQuery();
    dbUpdateMock.mockReturnValueOnce(chain);

    await markAsRead(42, 5);

    expect(dbUpdateMock).toHaveBeenCalledOnce();
    expect((chain.set as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ isRead: 1 });
  });

  it("includes both notificationId and userId in the WHERE condition", async () => {
    const chain = makeQuery();
    dbUpdateMock.mockReturnValueOnce(chain);

    await markAsRead(42, 5);

    // where() must be called (the double condition uses `and()`)
    expect((chain.where as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });
});

// ── markAllAsRead() ───────────────────────────────────────────────────────────

describe("markAllAsRead()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates all unread notifications for the user to isRead=1", async () => {
    const chain = makeQuery();
    dbUpdateMock.mockReturnValueOnce(chain);

    await markAllAsRead(5);

    expect(dbUpdateMock).toHaveBeenCalledOnce();
    expect((chain.set as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ isRead: 1 });
    expect((chain.where as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });
});
