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
        await page.locator(".wallpaperStudioSettingsButton").click();
        await page.locator(".wallpaperStudioHelp").click();
        await expect(page.locator(".backgroundHelpModal")).toBeVisible();
        await expect(page.locator(".backgroundHelpModal")).not.toContainText("backgroundLibrary.");
        await page.locator(".backgroundHelpClose").click();
        await expect(page.locator(".wallpaperStudio")).toBeVisible();
    });

    test("thumbnail click changes preview without applying, long press is not required", async ({ page }) => {
        await page.goto("/wallpapers");
        await page.locator(".wallpaperStudioSettingsButton").click();
        const tiles = page.locator(".wallpaperStudioTileChoose");
        await expect(tiles.nth(1)).toBeVisible();

        const apply = page.locator(".wallpaperHeaderApply");
        await tiles.nth(1).click();
        await expect(apply).toHaveAttribute("aria-pressed", "false");
        await expect(tiles.nth(1)).toHaveClass(/selected/);
        await page.locator(".wallpaperStudioSettingsButton").click();
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
        await expect(apply).toHaveAttribute("aria-pressed", "false");
        await apply.click();
        await expect(apply).toHaveAttribute("aria-pressed", "true");
    });

    test("wallpaper sheet handle supports vertical dragging", async ({ page }) => {
        await page.goto("/wallpapers");
        const handle = page.locator(".wallpaperStudioHandle");
        await expect(handle).not.toBeInViewport();
        await page.locator(".wallpaperStudioSettingsButton").click();
        await expect(handle).toBeVisible();
        let bounds = await handle.boundingBox();
        expect(bounds).not.toBeNull();
        if (!bounds) return;
        const x = bounds.x + bounds.width / 2;
        const y = bounds.y + bounds.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x, y + 110, { steps: 6 });
        await page.mouse.up();
        await expect(page.locator(".wallpaperStudio.expanded")).toBeVisible();

        bounds = await handle.boundingBox();
        if (!bounds) return;
        const nextX = bounds.x + bounds.width / 2;
        const nextY = bounds.y + bounds.height / 2;
        await page.mouse.move(nextX, nextY);
        await page.mouse.down();
        await page.mouse.move(nextX, nextY - 110, { steps: 6 });
        await page.mouse.up();
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
    });

    test("closed catalog is completely offscreen and clicking free preview closes it", async ({ page }) => {
        await page.goto("/wallpapers");
        const sheet = page.locator(".wallpaperStudioSheet");
        const handle = page.locator(".wallpaperStudioHandle");
        const screenHeight = page.viewportSize()?.height ?? 900;
        const initiallyHidden = await sheet.boundingBox();
        expect(initiallyHidden).not.toBeNull();
        if (initiallyHidden) expect(initiallyHidden.y).toBeGreaterThanOrEqual(screenHeight);
        await expect(handle).not.toBeInViewport();

        await page.locator(".wallpaperStudioSettingsButton").click();
        await expect(page.locator(".wallpaperStudio.expanded")).toBeVisible();
        await expect(handle).toBeVisible();

        await page.locator(".wallpaperStudioGestureSurface").click({ position: { x: 20, y: Math.floor(screenHeight * .09) } });
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
        await expect(handle).not.toBeInViewport();
    });

    test("wheel at the top of the open catalog closes it", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "chromium-desktop", "Desktop wheel only");
        await page.goto("/wallpapers");
        await page.locator(".wallpaperStudioSettingsButton").click();
        await page.locator(".wallpaperStudioScroll").evaluate(el => { el.scrollTop = 0; });
        await page.locator(".wallpaperStudioScroll").hover({ position: { x: 30, y: 40 } });
        await page.mouse.wheel(0, -180);
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
    });

    test("wallpaper settings use a modal, while the catalog remains a 90dvh sheet", async ({ page }) => {
        await page.goto("/wallpapers");
        await page.locator(".wallpaperStudioSettingsButton").click();
        await expect(page.locator(".wallpaperStudio.expanded")).toBeVisible();
        const sheet = await page.locator(".wallpaperStudioSheet").boundingBox();
        if (!sheet) return;
        expect(sheet.height).toBeGreaterThan((page.viewportSize()?.height ?? 600) * .85);
        await page.locator(".wallpaperStudioGearButton").click();
        await expect(page.locator(".wallpaperSettingsModal")).toBeVisible();
        await expect(page).toHaveURL(/\\/wallpapers$/);
        await expect(page.locator(".wallpaperStudioReset")).toHaveCount(0);
        await page.locator(".wallpaperSettingsModalClose").click();
        await expect(page.locator(".wallpaperStudio")).toBeVisible();
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
        await page.locator(".wallpaperStudioGearButton").click();
        await expect(page.locator(".wallpaperSettingsModal")).toBeVisible();
    });

    test("desktop canvas wheel hides the catalogue upward and reveals it downward", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "chromium-desktop", "Desktop studio only");
        await page.goto("/wallpapers");
        await page.mouse.move(200, 200);
        await page.mouse.wheel(0, 180);
        await expect(page.locator(".wallpaperStudio.expanded")).toBeVisible();
        await page.waitForTimeout(270);
        await page.mouse.wheel(0, -180);
        await expect(page.locator(".wallpaperStudio.collapsed")).toBeVisible();
    });

    test("mobile wallpaper gallery has four portrait columns and no card labels", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "webkit-mobile", "Mobile only");
        await page.goto("/wallpapers");
        await page.locator(".wallpaperStudioSettingsButton").click();
        await expect(page.locator(".wallpaperStudioTileLabel")).toHaveCount(0);
        await expect(page.locator(".wallpaperStudioTileCapabilities")).toHaveCount(0);
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

test("Japanese wallpaper assets are complete, decodable WebP containers", async ({ request }) => {
    for (const scene of ["ninja", "sakura", "alley", "torii"]) {
        for (const size of ["desktop", "mobile"]) {
            const label = `${scene}-${size}`;
            const response = await request.get(`/wallpapers/japanese-${label}.webp`);
            expect(response.ok(), `Missing Japanese wallpaper ${label}`).toBeTruthy();
            expect(response.headers()["content-type"]).toContain("image/webp");

            const bytes = await response.body();
            expect(bytes.length, `Truncated Japanese wallpaper ${label}`).toBeGreaterThan(100_000);
            expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
            expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
            expect(bytes.readUInt32LE(4) + 8, `Broken RIFF size for ${label}`).toBe(bytes.length);
        }
    }
});
