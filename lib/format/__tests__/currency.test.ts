import { describe, it, expect } from "vitest";
import { formatARS } from "../currency";

describe("formatARS", () => {
  it("formats positive numbers rounded", () => {
    expect(formatARS(1234.6)).toBe("$1.235");
  });

  it("handles null", () => {
    expect(formatARS(null)).toBe("$0");
  });

  it("formats negative numbers", () => {
    expect(formatARS(-500)).toBe("$-500");
  });

  it("handles negative numbers that round to zero", () => {
    expect(formatARS(-0.2)).toBe("$0");
    expect(formatARS(-0)).toBe("$0");
  });

  it("handles undefined and 0", () => {
    expect(formatARS(undefined)).toBe("$0");
    expect(formatARS(0)).toBe("$0");
  });
});
