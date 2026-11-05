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

    test("wallpaper help opens from its own page", async ({ page }) => {
        await page.goto("/settings/pers");
        await page.locator(".bgManageButton").first().click();
        await expect(page.locator(".wallpaperStudio")).toBeVisible();
        await page.locator(".wallpaperStudioHelp").click();
        await expect(page.locator(".backgroundHelpModal")).toBeVisible();
        await expect(page.locator(".backgroundHelpModal")).not.toContainText("backgroundLibrary.");
        await page.locator(".backgroundHelpClose").click();
        await expect(page.locator(".wallpaperStudio")).toBeVisible();
    });

    test("holding a thumbnail previews without applying and the compact strip can browse", async ({ page }) => {
        await page.goto("/wallpapers");
        const tiles = page.locator(".wallpaperStudioTileChoose");
        await expect(tiles.nth(1)).toBeVisible();

        await tiles.first().click();
        await expect(page.locator(".wallpaperStudioApply")).toBeDisabled();

        const box = await tiles.nth(1).boundingBox();
        expect(box).not.toBeNull();
        if (!box) return;

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(400);
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
        await page.mouse.up();

        await expect(page.locator(".wallpaperStudioApply")).toBeEnabled();
        const before = await page.locator(".wallpaperStudioHeading small").innerText();
        const strip = page.locator(".wallpaperStudioPeekButton");
        const bounds = await strip.boundingBox();
        if (!bounds) return;

        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width / 2 - 80, bounds.y + bounds.height / 2, { steps: 4 });
        await page.mouse.up();
        await expect.poll(async () => page.locator(".wallpaperStudioHeading small").innerText()).not.toBe(before);
        await expect(page.locator(".wallpaperStudioApply")).toBeEnabled();
    });

    test("wallpaper sheet can be collapsed and expanded by a vertical drag", async ({ page }) => {
        await page.goto("/wallpapers");
        const peek = page.locator(".wallpaperStudioPeekButton");
        const bounds = await peek.boundingBox();
        expect(bounds).not.toBeNull();
        if (!bounds) return;
        const x = bounds.x + bounds.width / 2;
        const y = bounds.y + bounds.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x, y + 95, { steps: 6 });
        await page.mouse.up();
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();

        const nextBounds = await peek.boundingBox();
        if (!nextBounds) return;
        const nextX = nextBounds.x + nextBounds.width / 2;
        const nextY = nextBounds.y + nextBounds.height / 2;
        await page.mouse.move(nextX, nextY);
        await page.mouse.down();
        await page.mouse.move(nextX, nextY - 110, { steps: 6 });
        await page.mouse.up();
        await expect(page.locator(".wallpaperStudio.expanded")).toBeVisible();
    });

    test("studio has a separate wallpaper settings route and a responsive sliding sheet", async ({ page }, testInfo) => {
        await page.goto("/wallpapers");
        await expect(page.locator(".wallpaperStudioSheet")).toBeVisible();
        await page.locator(".wallpaperStudioTabs button").nth(1).click();
        await expect(page).toHaveURL(/\\/wallpapers\\/settings$/);
        await expect(page.locator(".wallpaperStudioSettings")).toBeVisible();
        const sheet = await page.locator(".wallpaperStudioSheet").boundingBox();
        if (!sheet) return;
        if (testInfo.project.name === "webkit-mobile") {
            expect(sheet.height).toBeGreaterThan((page.viewportSize()?.height ?? 600) * .9);
        } else {
            expect(sheet.height).toBeLessThan((page.viewportSize()?.height ?? 1000) * .65);
        }
    });

    test("studio desktop sidebar stays under manual control regardless of setting", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "chromium-desktop", "Desktop studio only");
        await page.goto("/settings/pers");
        await page.locator('[data-setting-id="layout"] .selectorElement').nth(1).click();
        await page.goto("/wallpapers");
        await expect(page.locator(".sideMenu.open")).toBeVisible();
        await page.locator(".wallpaperStudioHeaderLeft .wallpaperStudioIcon").first().click();
        await expect(page.locator(".sideMenu:not(.open)")).toBeVisible();
        await page.locator(".wallpaperStudioTabs button").nth(1).click();
        await expect(page.locator(".sideMenu:not(.open)")).toBeVisible();
        await page.locator(".wallpaperStudioHeaderLeft .wallpaperStudioIcon").first().click();
        await expect(page.locator(".sideMenu.open")).toBeVisible();
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
