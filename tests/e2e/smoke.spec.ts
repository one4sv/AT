import { test, expect } from "@playwright/test";

// The test browser opts out of optional cookies before the application mounts.
// This avoids the consent banner blocking unrelated controls in smoke tests.
test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("at-cookie-consent-v1", "necessary"));
});

test("account settings style is available on the first direct navigation", async ({ page }) => {
    await page.route("**/api/user", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
            success: true, id: "css-user", nick: "stylefixture", username: "Тест профиля",
            bio: "Проверка оформления", avatar_url: null, date_of_birth: "2005-01-01",
            last_online: "2026-11-06T14:00:00Z"
        })
    }));
    await page.goto("/settings/acc");
    const info = page.locator(".settingInnerAccDiv .accInfo");
    await expect(info).toBeVisible();
    await expect(info).toHaveCSS("display", "flex");
    await expect(info).toHaveCSS("border-radius", "24px");
    await expect(info.locator(".accInfoMain")).toHaveCSS("display", "flex");
    await expect(info.locator(".accPic")).toHaveCSS("border-radius", "50%");
    await expect(info.locator(".accInfoNames")).toHaveCSS("display", "flex");
    await expect(info.locator(".accOnlineStauts")).toHaveCSS("display", "flex");
});

test("QR approval page loads status styles without opening another page", async ({ page }) => {
    await page.goto("/auth/qr");
    await expect(page.locator(".statusCard")).toBeVisible();
    await expect(page.locator(".statusPage")).toHaveCSS("display", "grid");
    await expect(page.locator(".statusCard")).toHaveCSS("border-radius", "24px");
});

test("feedback opens from Info and Contacts with a report reason choice", async ({ page }) => {
    await page.goto("/info");
    const entry = page.locator(".settingsButtsWrapper .settingButt").filter({ hasText: "Обратная связь" });
    await expect(entry).toBeVisible();
    await expect(entry).toHaveCSS("display", "grid");
    await expect(entry).toHaveCSS("border-radius", "24px");
    await expect(page.locator(".settingsSliderWrapper")).toHaveCSS("width", /[1-9][0-9.]*px/);
    await entry.click();

    const modal = page.locator(".feedbackModal");
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-setting-id="feedbackKind"]')).toBeVisible();
    await modal.locator('[data-setting-id="feedbackKind"] .radiobutt').filter({ hasText: "Жалоба" }).click();
    await expect(modal.locator('[data-setting-id="feedbackReason"]')).toBeVisible();
    await modal.getByRole("button", { name: "Закрыть" }).click();
    await expect(modal).toHaveCount(0);

    await page.goto("/info/contacts");
    await expect(page.locator(".infoText h3").first()).toBeVisible();
    const contactHeadings = await page.locator(".infoText h3").allTextContents();
    expect(contactHeadings.slice(0, 3)).toEqual(["Разработка", "Социальные сети", "Поддержка"]);
    const supportButton = page.locator(".contactFeedbackButton");
    await expect(supportButton).toHaveCSS("border-top-width", "0px");
    const height = await supportButton.evaluate(node => node.getBoundingClientRect().height);
    await supportButton.hover();
    const hoverHeight = await supportButton.evaluate(node => node.getBoundingClientRect().height);
    expect(Math.abs(hoverHeight - height)).toBeLessThan(0.5);
    await supportButton.click();
    await expect(page.locator(".feedbackModal")).toBeVisible();
    await expect(page.locator(".feedbackModal .sectionArt")).toHaveCount(0);
});

test("roadmap uses invariant English release names and its historical beginning date", async ({ page }) => {
    await page.goto("/info/roadmap");
    await expect(page.locator(".roadmapPage")).toBeVisible();
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.3 Songbird");
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
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.3 Songbird");

    await page.goto("/settings/language");
    await page.locator('.languageChoice').filter({ hasText: "Русский" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");

    await page.goto("/info/roadmap");
    await expect(page.locator(".roadmapPage h2")).toHaveText("Дорожная карта");
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.3 Songbird");
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

test("desktop page Header stays above routed content and its overlays", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem("settings_layout", "always"));
    await page.goto("/info/roadmap");

    const header = page.locator(".app-layout .page-content > .headerDiv");
    const route = page.locator(".app-layout .page-content > .routeTransition");
    await expect(header).toBeVisible();
    await expect(route).toBeVisible();

    const layers = await page.evaluate(() => ({
        header: Number(getComputedStyle(document.querySelector(".app-layout .page-content > .headerDiv")!).zIndex),
        route: Number(getComputedStyle(document.querySelector(".app-layout .page-content > .routeTransition")!).zIndex)
    }));
    expect(layers.header).toBeGreaterThan(layers.route);

    const headerReceivesPointer = await page.evaluate(() => {
        const route = document.querySelector(".app-layout .routeTransition")!;
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:absolute;top:0;left:0;right:0;height:10dvh;z-index:99999;pointer-events:auto";
        route.append(overlay);

        const header = document.querySelector<HTMLElement>(".app-layout .page-content > .headerDiv .header")!;
        const rect = header.getBoundingClientRect();
        const topmost = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        overlay.remove();
        return Boolean(topmost?.closest(".app-layout .page-content > .headerDiv"));
    });
    expect(headerReceivesPointer).toBe(true);
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

test("profile outside contacts shows on-demand online and hides unavailable status", async ({ page }) => {
    let visible = true;
    await page.route("**/api/user", route => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
    await page.route("**/api/acc/bob", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
            success: true,
            acc: {
                id: "public-profile", nick: "bob", username: "Бигбоб", bio: "",
                avatar_url: null, date_of_birth: null,
                is_online: visible, can_view_presence: visible,
                last_online: visible ? "2026-11-09T12:00:00Z" : null
            },
            habits: [], media: [], privateRules: { number: "nobody", mail: "nobody", habits: "all", posts: "all" }
        })
    }));
    await page.route("**/api/posts/bob", route => route.fulfill({
        status: 200, contentType: "application/json", body: JSON.stringify({ success: true, posts: [] })
    }));
    await page.goto("/acc/bob");
    await expect(page.locator(".accOnlineStauts")).toContainText("В сети");
    visible = false;
    await page.reload();
    await expect(page.locator(".accInfo")).toBeVisible();
    await expect(page.locator(".accOnlineStauts")).toHaveCount(0);
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

test("habit editor form and tag styles load on direct navigation without opening AddHabit", async ({ page }) => {
    await page.goto("/habit");
    await expect(page.locator(".page-content")).toBeAttached();

    await page.evaluate(() => {
        const fixture = document.createElement("div");
        fixture.id = "habit-editor-style-probe";
        fixture.innerHTML = `<div class="redHabit">
            <div class="addHabitWrapper">
                <label for="habit-form-probe-name">Название</label>
                <input class="addHabitInput" id="habit-form-probe-name" value="Тест" />
                <span>4/40</span>
            </div>
            <div class="addHabitTimeWrapper"><div class="addHabitWrapper time">
                <input class="addHabitInput" value="12:00" /></div></div>
            <div class="addHabitWrapper">
                <div class="tegSelector"><div class="tag active">Тег</div>
                    <div class="addTeg">Изменить</div></div>
                <div class="tagList">Список тегов</div>
            </div>
            <div class="dayChanger"><button>пн</button></div>
        </div>`;
        document.body.append(fixture);
    });

    const fixture = page.locator("#habit-editor-style-probe");
    await expect(fixture.locator(".addHabitWrapper").first()).toHaveCSS("display", "flex");
    await expect(fixture.locator(".addHabitInput").first()).toHaveCSS("border-radius", "24px");
    await expect(fixture.locator(".addHabitTimeWrapper")).toHaveCSS("display", "grid");
    await expect(fixture.locator(".tegSelector")).toHaveCSS("display", "flex");
    await expect(fixture.locator(".tag.active")).toHaveCSS("display", "flex");
    await expect(fixture.locator(".addTeg")).toHaveCSS("border-style", "solid");
    await expect(fixture.locator(".tagList")).toHaveCSS("opacity", "0");
    await expect(fixture.locator(".dayChanger")).toHaveCSS("display", "flex");
});

test("activity header styles and stacking are independent of Chat lazy loading", async ({ page }) => {
    await page.goto("/habit");
    await expect(page.locator(".page-content")).toBeAttached();
    await page.evaluate(() => {
        const fixture = document.createElement("div");
        fixture.className = "statsDiv";
        fixture.id = "habit-header-style-probe";
        fixture.innerHTML = `<div class="headerDiv">
            <div class="header habitNameMain">
                <div class="habitNameTag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 2 L22 22"/></svg></div>
                <div class="habitNameText">
                    <div class="habitName">Активность</div>
                    <span class="habitNameStatus">Серия выполнений</span>
                </div>
            </div>
        </div><div class="habitMenu"></div>`;
        document.querySelector(".page-content")!.append(fixture);
    });
    const fixture = page.locator("#habit-header-style-probe");
    const header = fixture.locator(":scope > .headerDiv");
    const menu = fixture.locator(":scope > .habitMenu");
    await expect(menu).toHaveCSS("z-index", "7");
    const headerLayer = Number(await header.evaluate(el => getComputedStyle(el).zIndex));
    const menuLayer = Number(await menu.evaluate(el => getComputedStyle(el).zIndex));
    expect(menuLayer).toBeGreaterThan(headerLayer);
    await expect(fixture.locator(".habitNameTag")).toHaveCSS("display", "flex");
    await expect(fixture.locator(".habitNameTag > svg")).toHaveCSS("width", /[1-9][0-9.]*px/);
    await expect(fixture.locator(".habitNameText")).toHaveCSS("flex-direction", "column");
    await expect(fixture.locator(".habitNameStatus")).toHaveCSS("font-size", "14px");
});

test("solid fill advertises the same capabilities before and after changing its settings", async ({ page }) => {
    await page.goto("/wallpapers");
    const basic = {
        logoEnabled: false, fillMode: "solid", fillColor: "#151515", fillGrad: "#303030",
        logoMode: "solid", logoColor: "#f5f2ff", logoGrad: "#916cf2", logoGlow: 0
    };
    await page.evaluate(style => {
        localStorage.setItem("settings_bg", JSON.stringify("color"));
        localStorage.setItem("settings_wallpaper_style", JSON.stringify(style));
    }, basic);
    await page.reload();

    const icons = page.locator(".wallpaperHeaderCapabilities > span");
    await expect(icons).toHaveCount(3);
    const before = await icons.evaluateAll(elements =>
        elements.map(item => ({ title: item.getAttribute("title"), svg: item.querySelector("svg")?.outerHTML }))
    );
    expect(before.every(item => item.title && item.svg)).toBe(true);

    await page.evaluate(style => {
        localStorage.setItem("settings_wallpaper_style", JSON.stringify(style));
    }, { ...basic, logoEnabled: true, fillMode: "gradient", logoGlow: 80 });
    await page.reload();
    await expect(icons).toHaveCount(3);
    const after = await icons.evaluateAll(elements =>
        elements.map(item => ({ title: item.getAttribute("title"), svg: item.querySelector("svg")?.outerHTML }))
    );
    expect(after).toEqual(before);
});

test("calendar month grids never bleed into adjacent slides on desktop and mobile", async ({ page }) => {
    await page.goto("/info/roadmap");
    await page.evaluate(async () => {
        await import("/src/pages/HabitPage/scss/calendar.scss");
        const fixture = document.createElement("div");
        fixture.id = "calendarLayoutFixture";
        const month = () => '<div class="calendarSlide"><div class="calendarDays">' +
            Array.from({ length: 35 }, (_, index) => `<div class="calDay">${index + 1}</div>`).join("") +
            '</div></div>';
        fixture.innerHTML = '<div class="calendarDiv"><div class="calendarMain"><div class="calendarSlider">' +
            '<div class="calendarSlidesWrapper">' + month() + month() + month() + '</div></div></div></div>';
        document.body.appendChild(fixture);
    });
    for (const width of [1074, 1440, 390]) {
        await page.setViewportSize({ width, height: 930 });
        const measurements = await page.evaluate(() => {
            const root = document.getElementById("calendarLayoutFixture")!;
            const slider = root.querySelector<HTMLElement>(".calendarSlider")!;
            slider.scrollLeft = slider.clientWidth;
            const slides = [...root.querySelectorAll<HTMLElement>(".calendarSlide")];
            const current = slides[1].getBoundingClientRect();
            const grid = slides[1].querySelector<HTMLElement>(".calendarDays")!.getBoundingClientRect();
            const days = [...slides[1].querySelectorAll<HTMLElement>(".calDay")].slice(0, 7);
            return {
                prevRight: slides[0].getBoundingClientRect().right,
                currentLeft: current.left,
                currentRight: current.right,
                nextLeft: slides[2].getBoundingClientRect().left,
                gridRight: grid.right,
                gridLeft: grid.left,
                columns: new Set(days.map(day => Math.round(day.getBoundingClientRect().left))).size
            };
        });
        expect(measurements.columns).toBe(7);
        expect(measurements.prevRight).toBeLessThanOrEqual(measurements.currentLeft + 1);
        expect(measurements.nextLeft).toBeGreaterThanOrEqual(measurements.currentRight - 1);
        expect(measurements.gridLeft).toBeGreaterThanOrEqual(measurements.currentLeft - 1);
        expect(measurements.gridRight).toBeLessThanOrEqual(measurements.currentRight + 1);
    }
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
