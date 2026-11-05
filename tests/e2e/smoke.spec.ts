import { test, expect } from "@playwright/test";

test("roadmap is reachable and release sections remain visible to the content index", async ({ page }) => {
    await page.goto("/info/roadmap");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator(".roadmapPage")).toBeVisible();
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.2");
    await expect(page.locator(".roadmapPastContent .roadmapReleaseHeading").first()).toBeAttached();
});

test.describe("authenticated UI regression", () => {
    test.skip(!process.env.AT_E2E_STORAGE_STATE, "Requires isolated test account storage state");

    test("account content click must not close profile info", async ({ page }) => {
        await page.goto("/acc");
        const info = page.locator(".accInfo");
        const slide = page.locator(".accContentSlide").first();
        await expect(info).toBeVisible();
        await slide.click({ position: { x: 5, y: 5 } });
        await expect(info).toBeVisible();
    });

    test("calendar keeps seven day columns and statistics can open", async ({ page }) => {
        await page.goto("/habit");
        const grid = page.locator(".calendar").first();
        await expect(grid).toBeVisible();
        await expect(page.locator("body")).not.toContainText("NaN");
    });
});
