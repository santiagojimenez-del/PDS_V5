import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConfig, getConfigValue, invalidateConfig } from "../services/config-loader";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const dbSelectMock  = vi.hoisted(() => vi.fn());
const cacheGetMock  = vi.hoisted(() => vi.fn());
const cacheSetMock  = vi.hoisted(() => vi.fn());
const cacheDelMock  = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: { select: dbSelectMock },
}));

vi.mock("@/lib/db/schema", () => ({ configuration: {} }));

vi.mock("@/lib/cache", () => ({
  cache: {
    get:    cacheGetMock,
    set:    cacheSetMock,
    delete: cacheDelMock,
  },
}));

vi.mock("@/lib/constants", () => ({
  CACHE_TTL: { CONFIGURATION: 21_600_000 },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_c: unknown, _v: unknown) => ({ eq: [_c, _v] })),
  or: vi.fn((...a: unknown[]) => ({ or: a })),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function makeQuery(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  for (const m of ["from", "where"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then    = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(rows).then(res, rej);
  chain.catch   = (rej: (e: unknown) => unknown) => Promise.resolve(rows).catch(rej);
  chain.finally = (cb: () => void) => Promise.resolve(rows).finally(cb);
  return chain;
}

// ── getConfig() ───────────────────────────────────────────────────────────────

describe("getConfig()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheGetMock.mockReturnValue(null); // default: cache miss
  });

  it("returns cached config without querying the DB on a cache hit", async () => {
    const cached = { site_name: "ProDrones Hub" };
    cacheGetMock.mockReturnValue(cached);

    const result = await getConfig("hub");

    expect(result).toBe(cached);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("fetches from DB and returns config on a cache miss", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "site_name", value: "ProDrones" },
    ]));

    const result = await getConfig("hub");

    expect(result).toMatchObject({ site_name: "ProDrones" });
  });

  it("stores the result in cache after a DB fetch", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "foo", value: "bar" },
    ]));

    await getConfig("hub");

    expect(cacheSetMock).toHaveBeenCalledWith(
      expect.stringContaining("hub"),
      expect.objectContaining({ foo: "bar" }),
      21_600_000
    );
  });

  it("global ('*') values are applied first", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "theme", value: "light" },
    ]));

    const result = await getConfig("hub");
    expect(result.theme).toBe("light");
  });

  it("app-specific values override global values with the same key", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*",   name: "theme", value: "light" },
      { application: "hub", name: "theme", value: "dark" },
    ]));

    const result = await getConfig("hub");
    expect(result.theme).toBe("dark");
  });

  it("global values not overridden by the app remain in the result", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*",   name: "currency", value: "USD" },
      { application: "hub", name: "theme",    value: "dark" },
    ]));

    const result = await getConfig("hub");
    expect(result.currency).toBe("USD");
    expect(result.theme).toBe("dark");
  });

  it("parses JSON objects stored as strings", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "roles", value: JSON.stringify([0, 1, 3]) },
    ]));

    const result = await getConfig("*");
    expect(result.roles).toEqual([0, 1, 3]);
  });

  it("parses JSON arrays stored as strings", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "features", value: '["billing","recurring"]' },
    ]));

    const result = await getConfig("*");
    expect(result.features).toEqual(["billing", "recurring"]);
  });

  it("keeps string values that are not valid JSON as plain strings", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "label", value: "Hello World" },
    ]));

    const result = await getConfig("*");
    expect(result.label).toBe("Hello World");
  });

  it("returns an empty object when no configuration rows exist", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([]));
    const result = await getConfig("hub");
    expect(result).toEqual({});
  });
});

// ── getConfigValue() ──────────────────────────────────────────────────────────

describe("getConfigValue()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheGetMock.mockReturnValue(null);
  });

  it("returns the value for an existing key", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "max_upload_mb", value: "50" },
    ]));

    const result = await getConfigValue("*", "max_upload_mb");
    expect(result).toBe("50");
  });

  it("returns null when the key does not exist", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([]));

    const result = await getConfigValue("hub", "nonexistent_key");
    expect(result).toBeNull();
  });

  it("returns a parsed object for JSON values", async () => {
    dbSelectMock.mockReturnValueOnce(makeQuery([
      { application: "*", name: "roles", value: '[0,1,3]' },
    ]));

    const result = await getConfigValue<number[]>("*", "roles");
    expect(result).toEqual([0, 1, 3]);
  });
});

// ── invalidateConfig() ────────────────────────────────────────────────────────

describe("invalidateConfig()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the specific app's cache key when app is provided", () => {
    invalidateConfig("hub");
    expect(cacheDelMock).toHaveBeenCalledWith("config:hub");
    expect(cacheDelMock).toHaveBeenCalledTimes(1);
  });

  it("deletes all known app cache keys when called without argument", () => {
    invalidateConfig();
    expect(cacheDelMock).toHaveBeenCalledWith("config:global");
    expect(cacheDelMock).toHaveBeenCalledWith("config:hub");
    expect(cacheDelMock).toHaveBeenCalledWith("config:client");
    expect(cacheDelMock).toHaveBeenCalledWith("config:admin");
    expect(cacheDelMock).toHaveBeenCalledTimes(4);
  });

  it("deletes only the admin cache key when app='admin'", () => {
    invalidateConfig("admin");
    expect(cacheDelMock).toHaveBeenCalledWith("config:admin");
    expect(cacheDelMock).toHaveBeenCalledTimes(1);
  });
});
