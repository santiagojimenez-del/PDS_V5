import { describe, it, expect } from "vitest";
import { validateRRule, previewOccurrences } from "../services/occurrence-generator";

// ── validateRRule() ───────────────────────────────────────────────────────────

describe("validateRRule()", () => {
  it("accepts a valid DAILY rule", () => {
    expect(validateRRule("FREQ=DAILY")).toEqual({ valid: true });
  });

  it("accepts a valid WEEKLY rule with BYDAY", () => {
    expect(validateRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR")).toEqual({ valid: true });
  });

  it("accepts a valid MONTHLY rule with BYMONTHDAY", () => {
    expect(validateRRule("FREQ=MONTHLY;BYMONTHDAY=1")).toEqual({ valid: true });
  });

  it("accepts a rule with COUNT", () => {
    expect(validateRRule("FREQ=DAILY;COUNT=10")).toEqual({ valid: true });
  });

  it("accepts a rule with UNTIL", () => {
    expect(validateRRule("FREQ=DAILY;UNTIL=20301231T000000Z")).toEqual({ valid: true });
  });

  it("accepts a rule with INTERVAL", () => {
    expect(validateRRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU")).toEqual({ valid: true });
  });

  it("returns valid=false for a completely invalid string", () => {
    const result = validateRRule("NOT_A_VALID_RRULE_AT_ALL");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns valid=false with an error message", () => {
    const result = validateRRule("FREQ=BADVALUE");
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(result.error!.length).toBeGreaterThan(0);
  });

  it("returns valid=false for an empty string", () => {
    // rrulestr('') throws
    const result = validateRRule("");
    expect(result.valid).toBe(false);
  });
});

// ── previewOccurrences() ──────────────────────────────────────────────────────

// Use a dtstart well in the future so all generated dates are always > now,
// making tests deterministic regardless of when they run.
const FUTURE_START = new Date(2030, 0, 1, 9, 0, 0); // 2030-01-01 09:00 local

describe("previewOccurrences()", () => {
  it("returns an empty array for an empty RRULE string", () => {
    const result = previewOccurrences("", "UTC", FUTURE_START);
    expect(result).toEqual([]);
  });

  it("returns Date instances", () => {
    const result = previewOccurrences("FREQ=DAILY", "UTC", FUTURE_START, 3);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((d) => expect(d).toBeInstanceOf(Date));
  });

  it("returns at most `count` dates", () => {
    const result = previewOccurrences("FREQ=DAILY", "UTC", FUTURE_START, 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns exactly `count` dates for an unlimited DAILY rule", () => {
    const result = previewOccurrences("FREQ=DAILY", "UTC", FUTURE_START, 7);
    expect(result).toHaveLength(7);
  });

  it("returns fewer than `count` when the rule is bounded by COUNT", () => {
    // COUNT=3 means only 3 occurrences exist
    const result = previewOccurrences("FREQ=DAILY;COUNT=3", "UTC", FUTURE_START, 10);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("respects weekly frequency — consecutive dates are 7 days apart", () => {
    const result = previewOccurrences("FREQ=WEEKLY", "UTC", FUTURE_START, 3);
    expect(result).toHaveLength(3);
    const diffMs = result[1].getTime() - result[0].getTime();
    expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("respects BYDAY constraint for weekly rules", () => {
    // BYDAY=MO means every occurrence falls on a Monday
    const result = previewOccurrences("FREQ=WEEKLY;BYDAY=MO", "UTC", FUTURE_START, 4);
    result.forEach((date) => {
      // getDay() === 1 is Monday
      expect(date.getDay()).toBe(1);
    });
  });

  it("returns an empty array for an invalid RRULE (error swallowed)", () => {
    const result = previewOccurrences("FREQ=BADVALUE", "UTC", FUTURE_START, 5);
    expect(result).toEqual([]);
  });

  it("handles null dtstart gracefully", () => {
    // With null dtstart the function passes undefined to rrulestr, which uses today.
    // We can't assert exact dates but we can assert it returns an array.
    const result = previewOccurrences("FREQ=DAILY", "UTC", null, 3);
    expect(Array.isArray(result)).toBe(true);
  });

  it("default count is 10 when omitted", () => {
    const result = previewOccurrences("FREQ=DAILY", "UTC", FUTURE_START);
    expect(result).toHaveLength(10);
  });

  it("all returned dates are in the future relative to dtstart", () => {
    const result = previewOccurrences("FREQ=DAILY", "UTC", FUTURE_START, 5);
    result.forEach((date) => {
      expect(date.getTime()).toBeGreaterThanOrEqual(FUTURE_START.getTime());
    });
  });
});
