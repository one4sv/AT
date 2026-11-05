import { test, expect } from "@playwright/test";

test.describe("appearance and wallpaper controls", () => {
    test.skip(!process.env.AT_E2E_STORAGE_STATE, "Requires an isolated authenticated test account");

    test("desktop side menu mode is persisted locally", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "chromium-desktop", "Desktop layout only");

        await page.goto("/settings/pers");
        const layout = page.locator('[data-setting-id="layout"]');
        await expect(layout.locator(".selectorElement")).toHaveCount(2);

        await layout.locator(".selectorElement").nth(1).click();
        await expect(page.locator(".mobile-layout")).toBeVisible();
        await expect(layout.locator(".selectorElement").nth(1)).toHaveAttribute("aria-pressed", "true");

        await page.reload();
        await expect(page.locator('[data-setting-id="layout"] .selectorElement').nth(1))
            .toHaveAttribute("aria-pressed", "true");

        await page.locator('[data-setting-id="layout"] .selectorElement').first().click();
        await expect(page.locator(".app-layout")).toBeVisible();
    });

    test("on phones the side menu has a native full-screen explanation", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "webkit-mobile", "Compact layout only");

        await page.goto("/settings/pers");
        const layout = page.locator('[data-setting-id="layout"]');
        await expect(layout.locator(".settingHint")).toBeVisible();
        await expect(layout.locator(".selector")).toHaveCount(0);
    });

    test("wallpaper help opens and returns to the background library", async ({ page }) => {
        await page.goto("/settings/pers");
        await page.locator(".bgManageButton").click();
        await expect(page.locator(".backgroundLibraryModal")).toBeVisible();
        await page.locator(".backgroundLibraryHeader .backgroundHelpButton").click();
        await expect(page.locator(".backgroundHelpModal")).toBeVisible();
        await expect(page.locator(".backgroundHelpModal")).not.toContainText("backgroundLibrary.");
        await expect(page.locator(".backgroundHelpTitle")).not.toBeEmpty();
        await page.locator(".backgroundHelpClose").click();
        await expect(page.locator(".backgroundLibraryModal")).toBeVisible();
        await expect(page.locator(".backgroundHelpModal")).toHaveCount(0);
    });
});

test("built-in Japanese wallpapers have desktop and mobile assets", async ({ request }) => {
    for (const scene of ["sakura", "alley", "torii"]) {
        for (const size of ["desktop", "mobile"]) {
            const response = await request.get(`/wallpapers/japanese-${scene}-${size}.webp`);
            expect(response.ok(), `Missing Japanese wallpaper ${scene}-${size}`).toBeTruthy();
            expect(response.headers()["content-type"]).toContain("image/webp");
        }
    }
});
