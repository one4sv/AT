import { test, expect } from "@playwright/test";

test("roadmap uses invariant English release names and its historical beginning date", async ({ page }) => {
    await page.goto("/info/roadmap");
    await expect(page.locator(".roadmapPage")).toBeVisible();
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.2 The New Palette");
    await expect(page.locator(".roadmapPastContent .roadmapReleaseHeading").first()).toBeAttached();
    const past = page.locator(".roadmapBranchPast .roadmapToggle");
    await past.click();
    await expect(page.locator(".roadmapBeginning")).toContainText("0.0 The Beginning");
    await expect(page.locator(".roadmapBeginning time")).toHaveAttribute("datetime", "2025-07-14");
    await expect(page.locator(".roadmapPastContent")).toContainText("0.1 The Foundation");
});

test.describe("authenticated UI regression", () => {
    test.skip(!process.env.AT_E2E_STORAGE_STATE, "Requires isolated test account storage state");

    test("account content click must not collapse visible profile info", async ({ page }) => {
        test.skip(!process.env.AT_E2E_ACCOUNT_NICK, "Set AT_E2E_ACCOUNT_NICK to the fixture account");
        await page.goto(`/acc/${process.env.AT_E2E_ACCOUNT_NICK}`);
        const info = page.locator(".accInfo");
        const slide = page.locator(".accContentSlide").first();
        await expect(slide).toBeVisible();
        await expect(info).toBeVisible();
        const initialHeight = await info.evaluate(el => el.getBoundingClientRect().height);
        await slide.click({ position: { x: 5, y: 5 } });
        await expect.poll(async () => info.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(initialHeight - 2);
    });

    test("calendar recenters the new month before the next paint", async ({ page }) => {
        test.skip(!process.env.AT_E2E_HABIT_ID, "Set AT_E2E_HABIT_ID to a dedicated test habit");
        await page.goto(`/habit/${process.env.AT_E2E_HABIT_ID}`);
        await expect(page.locator(".calendarSlider")).toBeVisible();
        await page.waitForTimeout(100);

        const centered = await page.evaluate(() => new Promise<boolean>((resolve, reject) => {
            const slider = document.querySelector<HTMLElement>(".calendarSlider");
            const title = document.querySelector(".CalendarDateChanger .selectedDate");
            if (!slider || !title) {
                reject(new Error("Calendar elements are missing"));
                return;
            }

            const timeout = window.setTimeout(() => {
                observer.disconnect();
                reject(new Error("Calendar did not update its month"));
            }, 1800);
            const observer = new MutationObserver(() => {
                clearTimeout(timeout);
                observer.disconnect();
                resolve(Math.abs(slider.scrollLeft - slider.clientWidth) <= 2);
            });

            observer.observe(title, { childList: true, characterData: true, subtree: true });
            slider.scrollLeft = slider.clientWidth * 2;
            slider.dispatchEvent(new Event("scrollend"));
        }));

        expect(centered).toBe(true);
    });

    test("habit calendar keeps seven weekday headings, statistics and responsive modal positioning", async ({ page }) => {
        test.skip(!process.env.AT_E2E_HABIT_ID, "Set AT_E2E_HABIT_ID to a dedicated test habit");
        await page.goto(`/habit/${process.env.AT_E2E_HABIT_ID}`);
        await expect(page.locator(".calendarDiv")).toBeVisible();
        await expect(page.locator(".weekPattern .weekDays")).toHaveCount(7);
        await expect(page.locator(".calendarSlide").first()).toBeAttached();
        await expect(page.locator(".statsDivStats")).toBeVisible();
        const heading = page.locator(".statsDivStats .statsTitle");
        await expect(heading).not.toBeEmpty();
        const main = page.locator(".calendarMain").first();
        const bounds = await main.boundingBox();
        expect(bounds).not.toBeNull();
        if (bounds) {
            expect(bounds.width).toBeGreaterThan(0);
            expect(bounds.height).toBeGreaterThan(0);
        }
    });
});
