import { test, expect } from "@playwright/test";

// The test browser opts out of optional cookies before the application mounts.
// This avoids the consent banner blocking unrelated controls in smoke tests.
test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("at-cookie-consent-v1", "necessary"));
});

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

test("language switch keeps roadmap translations and release names consistent", async ({ page }) => {
    await page.goto("/settings/language");
    await page.locator('.languageChoice').filter({ hasText: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/info/roadmap");
    await expect(page.locator(".roadmapPage h2")).toHaveText("Development roadmap");
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.2 The New Palette");

    await page.goto("/settings/language");
    await page.locator('.languageChoice').filter({ hasText: "Русский" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");

    await page.goto("/info/roadmap");
    await expect(page.locator(".roadmapPage h2")).toHaveText("Дорожная карта");
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.2 The New Palette");
});

test("wallpaper studio places SideMenu header above the panel", async ({ page }) => {
    await page.goto("/wallpapers");
    await expect(page.locator(".wallpaperStudio")).toBeAttached();
    await expect(page.locator(".sideMenu")).toBeAttached();

    // Anonymous visits intentionally do not render SMheader. Mount a temporary
    // node in the real layout to test the CSS stacking rule independently.
    const layers = await page.evaluate(() => {
        const layout = document.querySelector(".mobile-layout")!;
        const active = document.querySelector(".smHeader");
        const header = active || document.createElement("div");
        if (!active) {
            header.className = "smHeader";
            layout.appendChild(header);
        }
        const result = {
            side: Number(getComputedStyle(document.querySelector(".sideMenu")!).zIndex),
            header: Number(getComputedStyle(header).zIndex),
            page: Number(getComputedStyle(document.querySelector(".mobile-layout .page-content")!).zIndex)
        };
        if (!active) header.remove();
        return result;
    });
    expect(layers.header).toBeGreaterThan(layers.side);
    expect(layers.side).toBeGreaterThan(layers.page);
});

test("mobile SideMenu background covers the page header", async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await page.addInitScript(() => {
        localStorage.setItem("settings_decor", JSON.stringify("glass"));
        localStorage.setItem("settings_appearance", JSON.stringify({ settings_decor: "glass" }));
    });
    // /settings/language is a standalone route without ResponsiveLayout.
    await page.goto("/info/roadmap");
    await expect(page.locator(".mobile-layout > .headerDiv")).toBeAttached();
    await expect(page.locator(".sideMenuBackground")).toBeAttached();
    await expect(page.locator(".sideMenu")).toBeAttached();

    const layers = await page.evaluate(() => {
        const nav = document.querySelector(".SMnavDiv");
        return {
            header: Number(getComputedStyle(document.querySelector(".mobile-layout > .headerDiv")!).zIndex),
            background: Number(getComputedStyle(document.querySelector(".sideMenuBackground")!).zIndex),
            side: Number(getComputedStyle(document.querySelector(".sideMenu")!).zIndex),
            nav: nav ? Number(getComputedStyle(nav).zIndex) : null
        };
    });
    expect(layers.background).toBeGreaterThan(layers.header);
    expect(layers.side).toBeGreaterThan(layers.background);
    // SMnav is not mounted for unauthenticated visitors.
    if (layers.nav !== null) expect(layers.nav).toBeGreaterThan(layers.side);
});

test("mobile page shell retains background and SideMenu on internal navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/info/roadmap");
    const shell = page.locator(".mobile-layout");
    const background = shell.locator(":scope > .background");
    const sideMenu = shell.locator(":scope > .sideMenu");
    await expect(background).toBeAttached();
    await expect(sideMenu).toBeAttached();
    await background.evaluate(node => node.setAttribute("data-shell-persistent", "true"));
    await sideMenu.evaluate(node => node.setAttribute("data-menu-persistent", "true"));

    await page.evaluate(() => {
        history.pushState({}, "", "/info/faq");
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page).toHaveURL(/\/info\/faq$/);
    await expect(page.locator(".settingsDiv")).toBeAttached();
    await expect(background).toHaveAttribute("data-shell-persistent", "true");
    await expect(sideMenu).toHaveAttribute("data-menu-persistent", "true");
});


test("unauthenticated SideMenu has styled sign-in and theme buttons on direct navigation", async ({ page }) => {
    await page.goto("/info/roadmap");
    const signIn = page.locator(".sideMenuUnAthorised .greenButt");
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute("href", "/sign");
    await expect(signIn).toHaveCSS("background-image", /linear-gradient/);
    await expect(signIn).toHaveCSS("display", "flex");

    const theme = page.locator(".sideMenu > .changeSignTheme");
    await expect(theme).toHaveCSS("position", "absolute");
    await expect(theme).toHaveCSS("border-radius", "50%");
    const placement = await theme.evaluate(element => {
        const menu = element.closest(".sideMenu")!.getBoundingClientRect();
        const button = element.getBoundingClientRect();
        return { bottomGap: menu.bottom - button.bottom, leftGap: button.left - menu.left };
    });
    expect(placement.bottomGap).toBeGreaterThanOrEqual(0);
    expect(placement.bottomGap).toBeLessThan(100);
    expect(placement.leftGap).toBeGreaterThanOrEqual(0);
    expect(placement.leftGap).toBeLessThan(100);
});

test("guest profile hides account-only actions while shared action styles load directly", async ({ page }) => {
    await page.route("**/api/user", route => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
    await page.route("**/api/acc/bob", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
            success: true,
            acc: { id: "public-profile", nick: "bob", username: "Бигбоб", bio: "Привет", avatar_url: null,
                last_online: "2026-10-24T14:00:00Z", date_of_birth: null },
            habits: [], media: [], privateRules: { number: "all", mail: "all", habits: "all", posts: "all" }
        })
    }));
    await page.route("**/api/posts/bob", route => route.fulfill({
        status: 200, contentType: "application/json", body: JSON.stringify({ success: true, posts: [] })
    }));
    await page.goto("/acc/bob");
    const actions = page.locator(".accInfo .settingInnerList");
    await expect(actions).toBeVisible();
    await expect(actions).toHaveCSS("display", "flex");
    await expect(actions.locator(".settingInnerButt")).toHaveCount(1);
    await expect(actions.locator(".settingInnerButt")).toHaveCSS("display", "flex");
    await expect(page.locator(".accInfo .blockUserAction")).toHaveCount(0);
});

test("styles shared by lazy modal buttons exist without visiting their original pages", async ({ page }) => {
    await page.goto("/info/roadmap");
    await page.evaluate(() => {
        const root = document.createElement("div");
        root.id = "lazy-control-style-regression";
        root.innerHTML = `<div class="moduleName">Preview</div><div class="settingInnerList">
            <div class="settingInnerButt">Share</div></div>
            <button class="addHabitGoal">Cancel</button><button class="addHabitSave">Open</button>
            <button class="wtbgButt">Refresh</button>`;
        document.body.append(root);
    });
    const fixture = page.locator("#lazy-control-style-regression");
    await expect(fixture.locator(".moduleName")).toHaveCSS("display", "flex");
    await expect(fixture.locator(".settingInnerButt")).toHaveCSS("display", "flex");
    await expect(fixture.locator(".addHabitGoal")).toHaveCSS("display", "flex");
    await expect(fixture.locator(".addHabitSave")).toHaveCSS("background-image", /linear-gradient/);
    await expect(fixture.locator(".wtbgButt")).toHaveCSS("display", "inline-flex");
});

test.describe("authenticated UI regression", () => {
    test.skip(!process.env.AT_E2E_STORAGE_STATE, "Requires isolated test account storage state");

    test("habit header offers the SideMenu button on desktop in button-only mode", async ({ page }) => {
        test.skip(!process.env.AT_E2E_HABIT_ID, "Set AT_E2E_HABIT_ID to a test habit");
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.addInitScript(() => localStorage.setItem("settings_layout", "hidden"));
        await page.goto(`/habit/${process.env.AT_E2E_HABIT_ID}`);
        const button = page.locator(".statsDiv > .headerDiv > .headerButt");
        await expect(button).toBeVisible();
        await button.click();
        await expect(page.locator(".sideMenu")).toHaveClass(/open/);
    });

    test("SideMenu navigation and header keep the menu open after clicking", async ({ page }) => {
        await page.goto("/wallpapers");
        await page.locator(".wallpaperHeaderMenu").click();
        await expect(page.locator(".sideMenu")).toHaveClass(/open/);
        await page.locator('.SMnavButt[data-tab="habits"]').click();
        await expect(page.locator(".sideMenu")).toHaveClass(/open/);
        await page.locator(".smHeaderTitle").first().click();
        await expect(page.locator(".sideMenu")).toHaveClass(/open/);
    });

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

    test("statistics details and return keep the selected language", async ({ page }) => {
        test.skip(!process.env.AT_E2E_HABIT_ID, "Set AT_E2E_HABIT_ID to a dedicated test habit");
        await page.goto("/settings/language");
        await page.locator('.languageChoice').filter({ hasText: "English" }).click();
        await expect(page.locator("html")).toHaveAttribute("lang", "en");

        await page.goto(`/habit/${process.env.AT_E2E_HABIT_ID}`);
        const statistics = page.locator(".statsDivStats");
        await expect(statistics.locator(".overallDetailButt")).toBeVisible();
        await statistics.locator(".overallDetailButt").click();
        await expect(statistics.locator(".statsTitle")).toHaveText("Completions");

        await page.goto("/settings/language");
        await page.locator('.languageChoice').filter({ hasText: "Русский" }).click();
        await expect(page.locator("html")).toHaveAttribute("lang", "ru");

        await page.goto(`/habit/${process.env.AT_E2E_HABIT_ID}`);
        await expect(statistics.locator(".overallDetailButt")).toBeVisible();
        await statistics.locator(".overallDetailButt").click();
        await expect(statistics.locator(".statsTitle")).toHaveText("Выполнения");
        await statistics.locator(".statsTitle").click();
        await expect(statistics.locator(".statsTitle")).toHaveText("Статистика");
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
