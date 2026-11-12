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
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.4 Waypoint");
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
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.4 Waypoint");

    await page.goto("/settings/language");
    await page.locator('.languageChoice').filter({ hasText: "Русский" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");

    await page.goto("/info/roadmap");
    await expect(page.locator(".roadmapPage h2")).toHaveText("Дорожная карта");
    await expect(page.locator(".roadmapBranchCurrent")).toContainText("0.6.4 Waypoint");
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

    // The route is an isolated stacking context: even a child overlay with
    // a huge z-index cannot outrank its sibling Header. A hit test at an
    // arbitrary Header pixel is incorrect when the header has transparent or
    // non-interactive regions and the global SideMenu has its own layers.
    await expect(route).toHaveCSS("isolation", "isolate");
});

test("mobile swipe opens and closes SideMenu and cancelled swipe restores it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/info/roadmap");
    const menu = page.locator(".mobile-layout > .sideMenu");
    await expect(menu).toBeAttached();
    await expect(menu).not.toHaveClass(/open/);

    const swipe = async (selector: string, startX: number, endX: number, cancel = false) => {
        await page.evaluate(({ selector, startX, endX, cancel }) => {
            const target = document.querySelector<HTMLElement>(selector)!;
            const touch = (x: number) => new Touch({ identifier: 1, target, clientX: x, clientY: 300 });
            const fire = (name: string, x: number) => {
                const point = touch(x);
                target.dispatchEvent(new TouchEvent(name, {
                    bubbles: true, cancelable: true,
                    touches: name === "touchend" || name === "touchcancel" ? [] : [point],
                    targetTouches: name === "touchend" || name === "touchcancel" ? [] : [point],
                    changedTouches: [point]
                }));
            };
            fire("touchstart", startX);
            fire("touchmove", startX + (endX - startX) / 2);
            fire("touchmove", endX);
            fire(cancel ? "touchcancel" : "touchend", endX);
        }, { selector, startX, endX, cancel });
    };

    await swipe(".mobile-layout .page-content", 20, 170, true);
    await expect(menu).not.toHaveClass(/open/);
    // A short swipe crosses 32 px but does not reach the old -50% snap
    // position: it must return closed, not open by direction alone.
    await swipe(".mobile-layout .page-content", 20, 170);
    await expect(menu).not.toHaveClass(/open/);
    await swipe(".mobile-layout .page-content", 20, 260);
    await expect(menu).toHaveClass(/open/);
    // The open class changes before the 320-ms position animation finishes.
    // Start the next gesture only after SideMenu really reaches translateX(0%).
    await expect.poll(() => menu.evaluate(element => (element as HTMLElement).style.transform)).toBe("translateX(0%)");
    await swipe(".mobile-layout > .sideMenu", 300, 270);
    await expect(menu).toHaveClass(/open/);
    await expect.poll(() => menu.evaluate(element => (element as HTMLElement).style.transform)).toBe("translateX(0%)");
    await swipe(".mobile-layout > .sideMenu", 300, 140);
    await expect(menu).not.toHaveClass(/open/);
});

test("mobile swipe from a post or message context surface opens SideMenu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/info/roadmap");
    const menu = page.locator(".mobile-layout > .sideMenu");
    await expect(menu).toBeAttached();
    await expect(menu).not.toHaveClass(/open/);

    for (const type of ["PostDiv", "messageDiv"]) {
        await page.evaluate((type) => {
            const parent = document.querySelector<HTMLElement>(".mobile-layout .page-content")!;
            const surface = document.createElement("div");
            surface.className = type;
            surface.dataset.contextMenu = "true";
            const text = document.createElement("span");
            text.textContent = "Swipe test";
            surface.append(text);
            parent.append(surface);
            const touch = (x: number) => new Touch({
                identifier: 1, target: text, clientX: x, clientY: 250
            });
            const fire = (event: string, x: number) => {
                const point = touch(x);
                text.dispatchEvent(new TouchEvent(event, {
                    bubbles: true, cancelable: true,
                    touches: event === "touchend" ? [] : [point],
                    targetTouches: event === "touchend" ? [] : [point],
                    changedTouches: [point]
                }));
            };
            fire("touchstart", 25);
            fire("touchmove", 140);
            fire("touchmove", 290);
            fire("touchend", 290);
            surface.remove();
        }, type);
        await expect(menu).toHaveClass(/open/);
        await page.evaluate(() => {
            const menu = document.querySelector<HTMLElement>(".mobile-layout > .sideMenu")!;
            const touch = (x: number) => new Touch({
                identifier: 2, target: menu, clientX: x, clientY: 260
            });
            const fire = (name: string, x: number) => {
                const point = touch(x);
                menu.dispatchEvent(new TouchEvent(name, {
                    bubbles: true, cancelable: true,
                    touches: name === "touchend" ? [] : [point],
                    targetTouches: name === "touchend" ? [] : [point],
                    changedTouches: [point]
                }));
            };
            fire("touchstart", 315);
            fire("touchmove", 250);
            fire("touchmove", 115);
            fire("touchend", 115);
        });
        await expect(menu).not.toHaveClass(/open/);
    }
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


test("profile info collapses from active tab and wheel at top, not a regular content click", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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
    const info = page.locator(".accInfo");
    const activeTab = page.locator(".accContentButt.acbActive");
    const slide = page.locator(".accContentSlide").first();
    await expect(info).toBeVisible();
    await expect(activeTab).toBeVisible();
    const originalHeight = await info.evaluate(el => el.getBoundingClientRect().height);
    expect(originalHeight).toBeGreaterThan(50);

    await slide.click({ position: { x: 8, y: 8 } });
    await expect.poll(() => info.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(originalHeight - 2);

    await activeTab.click();
    // A fully collapsed AccInfo keeps its 1px top and bottom borders.
    await expect.poll(() => info.evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(2);
    await activeTab.click();
    await expect.poll(() => info.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(originalHeight - 2);

    await slide.evaluate(el => el.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true, cancelable: true, deltaY: 130
    })));
    await expect.poll(() => info.evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(2);
    await slide.evaluate(el => el.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true, cancelable: true, deltaY: -130
    })));
    await expect.poll(() => info.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(originalHeight - 2);
});

test("plan actions open from its section and shared header without changing edit layout", async ({ page }) => {
    const plan = {
        id: 7, owner_id: "fixture-owner", name: "План для теста", description: "Описание",
        plan_date: "2026-11-20", start_time: "13:00", end_time: "14:00",
        place: "Москва", tag: null, kind: "personal", completion_mode: "personal",
        status: "upcoming", is_owner: true, membership_status: "accepted",
        completed_for_me: false, members: [{
            id: "fixture-owner", nick: "owner", username: "Owner", avatar_url: null,
            completed: false, status: "accepted", is_owner: true
        }]
    };
    await page.route("**/api/plans/7", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, plan })
    }));
    await page.route("**/api/plans", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, plans: [] })
    }));
    await page.goto("/plan/7");
    const section = page.locator(".planMainSection");
    const name = page.locator("#planInlineName");
    const menu = page.locator(".ContextMenuWrapper");
    await expect(section).toBeVisible();
    await expect(name).toHaveAttribute("readonly", "");
    const before = await name.boundingBox();

    await section.click({ button: "right", position: { x: 16, y: 16 } });
    await expect(menu).toBeVisible();
    await menu.getByText("Редактировать").click();
    await expect(name).not.toHaveAttribute("readonly");
    const after = await name.boundingBox();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(2);

    // While editing, the header action is Save; right-click opens its context menu.
    await page.locator(".planHeaderActionsButt").click({ button: "right" });
    await expect(menu).toBeVisible();
    await menu.getByText("Назад").click();
    await expect(name).toHaveAttribute("readonly", "");
    await page.locator(".headerTitle").click();
    await expect(menu).toBeVisible();
    await expect(menu).toContainText("Удалить");
    await expect(menu).toContainText("Скопировать ссылку");
    await expect(menu).toContainText("Поделиться");
    await expect(menu).toContainText("Закрепить");
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

test("guest can read shared post comments and sees only sign-in in the footer", async ({ page }) => {
    const share = "33333333-3333-4333-8333-333333333333";
    let commentsShare: string | null = null;
    await page.addInitScript(() => localStorage.setItem("settings_lang", JSON.stringify("ru")));
    await page.route("**/api/user", route => route.fulfill({
        status: 401, contentType: "application/json",
        body: JSON.stringify({ success: false, cookie: true })
    }));
    await page.route("**/api/post/17?**", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, post: {
            id: 17, text: "Public post fixture", content: null, visibility: "link",
            user: { id: "post-owner", nick: "owner", username: "Post owner", avatar_url: null },
            media: [], likes: [], habit: null, comments_count: 1,
            created_at: "2026-11-01T12:00:00Z"
        } })
    }));
    await page.route("**/api/comments/17?**", route => {
        commentsShare = new URL(route.request().url()).searchParams.get("share");
        return route.fulfill({
            status: 200, contentType: "application/json",
            body: JSON.stringify({ success: true, comments: [{
                id: 42, post_id: 17, text: "Comment available to guests",
                files: [], likes: [], parent_id: null,
                created_at: "2026-11-01T13:00:00Z",
                user: { id: "comment-owner", nick: "commenter", username: "Commenter" }
            }] })
        });
    });
    await page.goto(`/post/17?share=${share}`);
    await expect(page.locator(".postComments .commentText")).toContainText("Comment available to guests");
    expect(commentsShare).toBe(share);
    const bottom = page.locator(".postCommentBottom .pageBottom");
    await expect(bottom.locator(".pageBottomAction")).toHaveCount(1);
    await expect(bottom.locator(".pageBottomAction")).toHaveText("Войти");
    await expect(bottom.locator(".pageBottomAction")).toHaveAttribute("href", "/sign");
    await expect(bottom.locator(".pageBottomBack")).toHaveCount(0);
    await expect(bottom.getByRole("button", { name: /Нравится/i })).toHaveCount(0);
});
