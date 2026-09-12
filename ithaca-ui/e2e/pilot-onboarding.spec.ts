import { expect, test } from "@playwright/test";
import { readPilotManifest, signInPilotUser } from "./pilot-helpers";

test.describe("pilot onboarding literacy", () => {
  test.beforeEach(async ({ page }) => {
    const manifest = readPilotManifest();
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
    await page.context().addCookies([
      {
        name: "ithaca_org_id",
        value: manifest.organizationId,
        domain: new URL(baseURL).hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  });

  test("shows the graph literacy dialog once and persists completion", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/explore");
    const dialog = page.getByTestId("onboarding-dialog");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await expect(dialog.getByText("How to read the graph")).toBeVisible();

    await page.getByTestId("onboarding-complete-button").click();
    await expect(dialog).not.toBeVisible();

    await page.reload();
    await expect(page.getByRole("link", { name: "Explore" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("onboarding-dialog")).not.toBeVisible();
  });
});
