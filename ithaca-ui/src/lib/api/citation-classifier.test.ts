import { describe, expect, it } from "vitest";
import { USER_CORRECTION_VERSION } from "@/lib/api/citation-classifier";

describe("correction supersession", () => {
  it("uses a dedicated immutable correction version", () => {
    expect(USER_CORRECTION_VERSION).toBeGreaterThan(100);
  });
});
