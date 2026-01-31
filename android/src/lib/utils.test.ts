import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseTimeInputToISOString,
  getTodayDateString,
  formatTimeAsHHmm,
} from "./utils";

describe("parseTimeInputToISOString", () => {
  const baseDate = "2024-07-31"; // This will be treated as YYYY-MM-DD 00:00:00 in the local timezone by new Date()

  // Helper to create expected ISO string
  const getExpectedISO = (hours: number, minutes: number): string => {
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0); // Sets time in local timezone
    return date.toISOString(); // Converts to UTC ISO string
  };

  // Valid Test Cases - Only 4-digit format is supported
  it('should return null for "HH:mm" format (e.g., "17:30") - no longer supported', () => {
    expect(parseTimeInputToISOString("17:30", baseDate)).toBeNull();
  });

  it('should return null for "HH時MM分" format (e.g., "17時30分") - no longer supported', () => {
    expect(parseTimeInputToISOString("17時30分", baseDate)).toBeNull();
  });

  it('should return null for "HH時" format (e.g., "17時") - no longer supported', () => {
    expect(parseTimeInputToISOString("17時", baseDate)).toBeNull();
  });

  it('should parse "HHMM" 4-digit format (e.g., "1730")', () => {
    expect(parseTimeInputToISOString("1730", baseDate)).toBe(
      getExpectedISO(17, 30),
    );
  });

  it('should parse "HHMM" 4-digit format with leading zero (e.g., "0900")', () => {
    expect(parseTimeInputToISOString("0900", baseDate)).toBe(
      getExpectedISO(9, 0),
    );
  });

  it('should return null for single-digit hour format (e.g., "9") - no longer supported', () => {
    expect(parseTimeInputToISOString("9", baseDate)).toBeNull();
  });

  it('should return null for double-digit hour format (e.g., "17") - no longer supported', () => {
    expect(parseTimeInputToISOString("17", baseDate)).toBeNull();
  });

  it('should return null for "00:00" - no longer supported', () => {
    expect(parseTimeInputToISOString("00:00", baseDate)).toBeNull();
  });

  it('should return null for "23:59" - no longer supported', () => {
    expect(parseTimeInputToISOString("23:59", baseDate)).toBeNull();
  });

  it('should parse "0000" 4-digit format for midnight', () => {
    expect(parseTimeInputToISOString("0000", baseDate)).toBe(
      getExpectedISO(0, 0),
    );
  });

  // Invalid Test Cases
  it('should return null for invalid format "abc"', () => {
    expect(parseTimeInputToISOString("abc", baseDate)).toBeNull();
  });

  it('should return null for invalid format "12:345" (too many minutes digits)', () => {
    expect(parseTimeInputToISOString("12:345", baseDate)).toBeNull();
  });

  it('should return null for invalid format "12:34:56" (too many colons)', () => {
    expect(parseTimeInputToISOString("12:34:56", baseDate)).toBeNull();
  });

  it('should return null for invalid hour "2500"', () => {
    expect(parseTimeInputToISOString("2500", baseDate)).toBeNull();
  });

  it('should return null for invalid minute "1270"', () => {
    expect(parseTimeInputToISOString("1270", baseDate)).toBeNull();
  });

  it('should return null for invalid format "12:aa" (non-numeric minutes)', () => {
    expect(parseTimeInputToISOString("12:aa", baseDate)).toBeNull();
  });

  it('should return null for invalid format "12時70分" (invalid minutes with 時分)', () => {
    expect(parseTimeInputToISOString("12時70分", baseDate)).toBeNull();
  });

  it('should return null for "123" (not 4 digits for HHmm, not 1 or 2 for H/HH)', () => {
    expect(parseTimeInputToISOString("123", baseDate)).toBeNull();
  });

  it('should return null for "12345" (too long for any format)', () => {
    expect(parseTimeInputToISOString("12345", baseDate)).toBeNull();
  });

  it('should return null for empty string ""', () => {
    expect(parseTimeInputToISOString("", baseDate)).toBeNull();
  });

  it('should return null for "24:00" (invalid format)', () => {
    expect(parseTimeInputToISOString("24:00", baseDate)).toBeNull();
  });

  it('should return null for "12:60" (invalid format)', () => {
    expect(parseTimeInputToISOString("12:60", baseDate)).toBeNull();
  });

  it('should return null for "2400" (invalid hour in 4-digit format)', () => {
    expect(parseTimeInputToISOString("2400", baseDate)).toBeNull();
  });

  it('should return null for "1260" (invalid minute in 4-digit format)', () => {
    expect(parseTimeInputToISOString("1260", baseDate)).toBeNull();
  });

  it('should parse "2359" 4-digit format for 23:59', () => {
    expect(parseTimeInputToISOString("2359", baseDate)).toBe(
      getExpectedISO(23, 59),
    );
  });
});

describe("getTodayDateString", () => {
  beforeEach(() => {
    // Mock Date.prototype.toLocaleString
    vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(
      // @ts-expect-error - Mocking Date.prototype.toLocaleString with simplified signature
      function (
        this: Date,
        locales?: string | string[],
        options?: Intl.DateTimeFormatOptions,
      ) {
        if (locales === "ja-JP" && options?.timeZone === "Asia/Tokyo") {
          // Mock a specific date for testing
          return "2024/12/31 12:00:00";
        }
        return "";
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return today's date in YYYY-MM-DD format", () => {
    const result = getTodayDateString();
    expect(result).toBe("2024-12-31");
  });

  it("should pad single-digit month and day with zero", () => {
    // Mock a date with single-digit month and day
    vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(
      // @ts-expect-error - Mocking Date.prototype.toLocaleString with simplified signature
      function (
        this: Date,
        locales?: string | string[],
        options?: Intl.DateTimeFormatOptions,
      ) {
        if (locales === "ja-JP" && options?.timeZone === "Asia/Tokyo") {
          return "2024/1/5 12:00:00";
        }
        return "";
      },
    );

    const result = getTodayDateString();
    expect(result).toBe("2024-01-05");
  });
});

describe("formatTimeAsHHmm", () => {
  it("should format valid ISO string to HHmm format", () => {
    // Create a date: 2024-07-31 17:30 in local timezone
    const date = new Date("2024-07-31");
    date.setHours(17, 30, 0, 0);
    const isoString = date.toISOString();

    const result = formatTimeAsHHmm(isoString);
    expect(result).toBe("1730");
  });

  it("should format midnight as 0000", () => {
    const date = new Date("2024-07-31");
    date.setHours(0, 0, 0, 0);
    const isoString = date.toISOString();

    const result = formatTimeAsHHmm(isoString);
    expect(result).toBe("0000");
  });

  it("should format morning time with leading zeros", () => {
    const date = new Date("2024-07-31");
    date.setHours(9, 5, 0, 0);
    const isoString = date.toISOString();

    const result = formatTimeAsHHmm(isoString);
    expect(result).toBe("0905");
  });

  it("should return null for null input", () => {
    expect(formatTimeAsHHmm(null)).toBeNull();
  });

  it("should format 23:59 as 2359", () => {
    const date = new Date("2024-07-31");
    date.setHours(23, 59, 0, 0);
    const isoString = date.toISOString();

    const result = formatTimeAsHHmm(isoString);
    expect(result).toBe("2359");
  });

  it("should return null for invalid date string", () => {
    expect(formatTimeAsHHmm("invalid-date")).toBeNull();
  });
});
