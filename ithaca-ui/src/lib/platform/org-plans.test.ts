import { describe, expect, it } from "vitest";
import {
  getPlanEntitlements,
  isEmailAllowedForOrganization,
  isOrganizationPlanId,
  normalizeEmailDomain,
  parseEmailDomainList,
  planQuotaFields,
} from "./org-plans";

describe("org plans", () => {
  it("gives institutions more seats than labs and solos", () => {
    expect(getPlanEntitlements("SOLO").maxMembers).toBeLessThan(
      getPlanEntitlements("LAB").maxMembers,
    );
    expect(getPlanEntitlements("LAB").maxMembers).toBeLessThan(
      getPlanEntitlements("INSTITUTION").maxMembers,
    );
    expect(planQuotaFields("LAB").plan).toBe("LAB");
    expect(getPlanEntitlements("LAB").collaborativeWorkspaces).toBe(true);
    expect(getPlanEntitlements("SOLO").collaborativeWorkspaces).toBe(false);
    expect(isOrganizationPlanId("INSTITUTION")).toBe(true);
    expect(isOrganizationPlanId("ENTERPRISE")).toBe(false);
  });

  it("enforces domain allowlists for institutional invites", () => {
    expect(normalizeEmailDomain("Ada@Lab.EDU")).toBe("lab.edu");
    expect(
      isEmailAllowedForOrganization("ada@lab.edu", ["lab.edu", "college.edu"]),
    ).toBe(true);
    expect(
      isEmailAllowedForOrganization("ada@gmail.com", ["lab.edu"]),
    ).toBe(false);
    expect(isEmailAllowedForOrganization("ada@lab.edu", [])).toBe(true);
    expect(parseEmailDomainList("lab.edu, College.EDU\nlab.edu")).toEqual([
      "lab.edu",
      "college.edu",
    ]);
  });
});
