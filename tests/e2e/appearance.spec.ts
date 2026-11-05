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

    test("on phones the side menu setting is absent", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "webkit-mobile", "Compact layout only");

        await page.goto("/settings/pers");
        const layout = page.locator('[data-setting-id="layout"]');
        await expect(layout).toHaveCount(0);
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

        const apply = page.locator(".wallpaperHeaderApply");
        const initialSelected = await apply.getAttribute("aria-pressed");
        await tiles.nth(1).click();
        await expect(apply).toHaveAttribute("aria-pressed", "false");
        await expect(page.locator(".wallpaperStudioTileChoose").nth(1)).toHaveClass(/selected/);
        expect(initialSelected).toBeTruthy();

        const box = await tiles.nth(1).boundingBox();
        expect(box).not.toBeNull();
        if (!box) return;

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(400);
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
        await page.mouse.up();

        await expect(apply).toHaveAttribute("aria-pressed", "false");
        const before = await page.locator(".headerCustomText").innerText();
        const strip = page.locator(".wallpaperStudioPeekButton");
        const bounds = await strip.boundingBox();
        if (!bounds) return;

        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width / 2 - 80, bounds.y + bounds.height / 2, { steps: 4 });
        await page.mouse.up();
        await expect.poll(async () => page.locator(".headerCustomText").innerText()).not.toBe(before);
        await expect(apply).toHaveAttribute("aria-pressed", "false");
        await apply.click();
        await expect(apply).toHaveAttribute("aria-pressed", "true");
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
        await page.locator(".wallpaperStudioSettingsButton").click();
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

    test("desktop studio has no SideMenu and uses native Header and PageBottom", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "chromium-desktop", "Desktop studio only");
        await page.goto("/wallpapers");
        await expect(page.locator(".sideMenu")).toHaveCount(0);
        await expect(page.locator(".smHeader")).toHaveCount(0);
        await expect(page.locator(".wallpaperStudio > .headerDiv")).toBeVisible();
        await expect(page.locator(".wallpaperStudioBottom.pageBottom")).toBeVisible();
        const sheet = await page.locator(".wallpaperStudioSheet").boundingBox();
        expect(sheet).not.toBeNull();
        if (sheet) expect(sheet.width).toBeGreaterThan((page.viewportSize()?.width ?? 1000) * .95);
        await page.locator(".wallpaperStudioSettingsButton").click();
        await expect(page.locator(".sideMenu")).toHaveCount(0);
    });

    test("desktop canvas wheel hides the catalogue upward and reveals it downward", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "chromium-desktop", "Desktop studio only");
        await page.goto("/wallpapers");
        await page.mouse.move(200, 200);
        await page.mouse.wheel(0, -180);
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
        await page.waitForTimeout(270);
        await page.mouse.wheel(0, 180);
        await expect(page.locator(".wallpaperStudio.expanded")).toBeVisible();
    });

    test("mobile wallpaper gallery has four portrait columns and no card labels", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "webkit-mobile", "Mobile only");
        await page.goto("/wallpapers");
        await expect(page.locator(".wallpaperStudioTileLabel").first()).toBeHidden();
        const tile = page.locator(".wallpaperStudioTileImage").first();
        const bounds = await tile.boundingBox();
        expect(bounds).not.toBeNull();
        if (!bounds) return;
        expect(bounds.height).toBeGreaterThan(bounds.width);
        const grid = page.locator(".wallpaperStudioGrid").first();
        const columns = await grid.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        expect(columns).toBe(4);
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
