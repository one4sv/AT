import { test, expect } from "@playwright/test";

// Settings tests use a synthetic account; the wallpaper service worker must not bypass route mocks after reload.
test.use({ serviceWorkers: "block" });

// These tests use a synthetic account response. They never modify production data,
// send account-deletion emails or depend on a real user's cookies.
test.beforeEach(async ({ page, context }) => {
    await page.addInitScript(() => localStorage.setItem("at-cookie-consent-v1", "necessary"));
    await context.route("**/api/user", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
            success: true, id: "settings-fixture", nick: "settingsfixture",
            username: "Settings Fixture", mail: "fixture@example.invalid",
            bio: "", avatar_url: null, date_of_birth: "2005-01-01",
            last_online: new Date().toISOString()
        })
    }));
});

test("device-local font, date and time preferences survive a reload", async ({ page }, testInfo) => {
    await page.goto("/settings/gen");
    await expect(page.locator('[data-setting-id="fontSize"]')).toBeVisible();
    // Wait for the synthetic user to finish loading before setting account-scoped values.
    await expect.poll(() => page.evaluate(() => localStorage.getItem("settingsfixture_settings_font_size"))).not.toBeNull();
    const fontLine = await page.locator('[data-setting-id="fontSize"] .seekBarLine').boundingBox();
    expect(fontLine).not.toBeNull();
    if (testInfo.project.name === "webkit-mobile") {
        await page.locator('[data-setting-id="fontSize"] .seekBarLine').tap({
            position: { x: fontLine!.width * 0.8, y: fontLine!.height / 2 }
        });
    } else {
        await page.mouse.click(fontLine!.x + fontLine!.width * 0.8, fontLine!.y + fontLine!.height / 2);
    }
    await page.locator('[data-setting-id="dateFormat"] .radiobutt').nth(1).click();
    await page.locator('[data-setting-id="timeFormat"] .radiobutt').nth(1).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("settingsfixture_settings_font_size"))).toBe("20");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("settingsfixture_settings_date_format"))).toBe('"american"');
    await expect.poll(() => page.evaluate(() => localStorage.getItem("settingsfixture_settings_time_format"))).toBe('"twelve"');
    await page.reload();
    await expect.poll(() => page.locator("html").evaluate(el => getComputedStyle(el).fontSize)).toBe("20px");
    await expect(page.locator("html")).toHaveAttribute("data-date-format", "american");
    await expect(page.locator("html")).toHaveAttribute("data-time-format", "twelve");
    await expect(page.locator('[data-setting-id="dateFormat"] .radiobutt').nth(1)).toHaveClass(/active/);
    await expect(page.locator('[data-setting-id="timeFormat"] .radiobutt').nth(1)).toHaveClass(/active/);
});

test("account deletion requires an explicit code and phone change is hidden", async ({ page }) => {
    await page.goto("/settings/acc");
    await expect(page.locator('[data-setting-id="editAcc"]')).toBeVisible();
    await expect(page.locator('[data-setting-id="phone"]')).toHaveCount(0);
    const removal = page.locator('[data-setting-id="deleteAccount"]');
    await removal.click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.locator("#accountCurrentPassword")).toBeVisible();
    await expect(modal.getByRole("button", { name: /код|code/i })).toBeDisabled();
    const checkbox = modal.locator("#accountDeleteMessages");
    await expect(checkbox).not.toBeChecked();
    await modal.locator('label[for="accountDeleteMessages"]').click();
    await expect(checkbox).toBeChecked();
    await expect(modal.locator('label[for="accountDeleteMessages"] svg')).toBeVisible();
    await expect(modal.locator("#deleteAccountCode")).toHaveCount(0);
});

test("changing email opens a modal with the code button on the right", async ({ page }) => {
    await page.goto("/settings/acc");
    await expect(page.locator("#accountNewEmail")).toHaveCount(0);
    await page.locator('[data-setting-id="email"] button').click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.locator("#accountNewEmail")).toBeVisible();
    await expect(modal.locator("#accountCurrentPassword")).toBeVisible();
    await expect(page.locator(".settingCollapsibleInner")).toHaveCount(0);
    const buttons = modal.locator(".accountSecurityActions > button");
    const cancelBox = await buttons.first().boundingBox();
    const sendBox = await buttons.last().boundingBox();
    expect(cancelBox).not.toBeNull();
    expect(sendBox).not.toBeNull();
    expect(sendBox!.x).toBeGreaterThan(cancelBox!.x);
    await expect(buttons.last()).toBeDisabled();

    await modal.locator(".accountSecurityClose").click();
    await expect(modal).toHaveCount(0);
});

test("pending deletion uses the separate recovery page and a live countdown", async ({ page }) => {
    await page.addInitScript(() => {
        sessionStorage.setItem("at-pending-deletion", JSON.stringify({
            email: "fixture@example.invalid",
            deadline: new Date(Date.now() + 2 * 3600000 + 20 * 60000).toISOString()
        }));
    });
    await page.goto("/account-deletion");
    await expect(page.locator(".accountDeletionCard")).toBeVisible();
    await expect(page.locator(".accountDeletionCounter strong")).toContainText(/2\s*(час|hour)/);
    await expect(page.locator("#deletionRecoveryEmail")).toHaveValue("fixture@example.invalid");
    await expect(page.locator("#deletionRecoveryPassword")).toBeVisible();
    await expect(page.locator("#deletionRecoveryCode")).toHaveCount(0);
});

test("PWA installation help is not shown on desktop browsers", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop-only platform check");
    await page.goto("/settings/notes");
    await expect(page.locator(".notificationPermissionPanel")).toBeVisible();
    await expect(page.locator(".notificationPermissionSecondary")).toHaveCount(0);
});


test("danger and security button styles load when settings pages are opened directly", async ({ page }) => {
    await page.goto("/settings/acc");
    const danger = page.locator('[data-setting-id="deleteAccount"]');
    await expect(danger).toBeVisible();
    await expect(danger).toHaveCSS("display", "flex");
    const dangerColors = await danger.evaluate(element => {
        const reference = document.createElement("span");
        reference.style.color = "var(--notValid)";
        document.body.appendChild(reference);
        const colors = { actual: getComputedStyle(element).color, expected: getComputedStyle(reference).color };
        reference.remove();
        return colors;
    });
    expect(dangerColors.actual).toBe(dangerColors.expected);

    await page.goto("/settings/security");
    const safety = page.locator(".safetyButt").first();
    await expect(safety).toBeVisible();
    await expect.poll(() => page.locator("html").evaluate(element =>
        getComputedStyle(element).getPropertyValue("--inner_text").trim()
    )).not.toBe("");
    const safetyColors = await safety.evaluate(element => {
        const reference = document.createElement("span");
        reference.style.color = "var(--inner_text)";
        document.body.appendChild(reference);
        const colors = { actual: getComputedStyle(element).color, expected: getComputedStyle(reference).color };
        reference.remove();
        return colors;
    });
    expect(safetyColors.actual).toBe(safetyColors.expected);
});


test("native time controls fit two columns on mobile and desktop", async ({ page }, testInfo) => {
    await page.goto("/settings/notes");
    await expect(page.locator(".settingTab")).toBeVisible();
    await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.id = "native-time-layout-probe";
        probe.style.cssText = "position:fixed;inset:22% auto auto 5vw;width:90vw;max-width:450px;padding:3vw;box-sizing:border-box;background:var(--mc);z-index:3000";
        probe.innerHTML = '<div class="addHabitTimeWrapper timeInputs">' +
            '<div class="addHabitWrapper time"><label>Начало (необязательно)</label>' +
            '<div class="timeInputShell"><input type="time" class="addHabitInput" value="13:00"></div></div>' +
            '<div class="addHabitWrapper time"><label>Конец (необязательно)</label>' +
            '<div class="timeInputShell"><input type="time" class="addHabitInput"></div></div></div>';
        document.body.appendChild(probe);
    });
    const fields = page.locator("#native-time-layout-probe input[type=time]");
    await expect(fields).toHaveCount(2);
    const shells = page.locator("#native-time-layout-probe .timeInputShell");
    await expect(shells).toHaveCount(2);
    await expect(shells.first()).toHaveCSS("border-radius", "24px");
    await expect(shells.last()).toHaveCSS("border-radius", "24px");
    const rects = await fields.evaluateAll(inputs => inputs.map(input => {
        const rect = input.getBoundingClientRect();
        const style = getComputedStyle(input);
        return { left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom, width:rect.width,
            fontSize:parseFloat(style.fontSize), scrollWidth:input.scrollWidth,
            clientWidth:input.clientWidth };
    }));
    expect(rects[0].width).toBeGreaterThan(80);
    expect(rects[1].width).toBeGreaterThan(80);
    expect(rects[0].right).toBeLessThanOrEqual(rects[1].left + 1);
    expect(Math.abs(rects[0].top - rects[1].top)).toBeLessThanOrEqual(2);
    if (testInfo.project.name === "webkit-mobile") {
        expect(rects[0].width).toBeGreaterThan(120);
        expect(rects[1].width).toBeGreaterThan(120);
        expect(rects[0].fontSize).toBeGreaterThanOrEqual(16);
        expect(rects[1].fontSize).toBeGreaterThanOrEqual(16);
    }
});


test("SideMenu list reserves space for its overlapping navigation bar", async ({ page }) => {
    await page.goto("/settings/notes");
    await expect(page.locator(".sideMenu")).toBeAttached();
    await expect(page.locator(".SMnavDiv")).toBeAttached();
    await expect.poll(() => page.locator(".sideMenu").evaluate(element =>
        getComputedStyle(element).getPropertyValue("--sm-nav-clearance").trim()
    )).not.toBe("");

    const dimensions = await page.evaluate(() => {
        const sideMenu = document.querySelector<HTMLElement>(".sideMenu")!;
        const nav = document.querySelector<HTMLElement>(".SMnavDiv")!;
        const list = document.createElement("div");
        list.className = "SMlist";
        sideMenu.querySelector(".slide")?.appendChild(list);
        const clearance = parseFloat(getComputedStyle(sideMenu).getPropertyValue("--sm-nav-clearance"));
        const padding = parseFloat(getComputedStyle(list).paddingBottom);
        const overlap = sideMenu.getBoundingClientRect().bottom - nav.getBoundingClientRect().top;
        list.remove();
        return { clearance, padding, overlap };
    });
    expect(dimensions.clearance).toBeGreaterThan(0);
    expect(Math.abs(dimensions.clearance - dimensions.overlap)).toBeLessThanOrEqual(2);
    expect(dimensions.padding).toBeGreaterThan(dimensions.overlap);
});

test("personal plan participants can be invited and removed from its details page", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem("at_startup_preferences", JSON.stringify({ settings_mobile_start_menu: false }));
        localStorage.setItem("settingsfixture_settings_mobile_start_menu", "false");
    });
    const contactId = "22222222-2222-4222-8222-222222222222";
    let invited = false;
    let removed = false;
    const currentPlan = () => ({
        id: 7, owner_id: "settings-fixture", name: "Plan members fixture", description: "",
        plan_date: "2026-11-20", start_time: null, end_time: null,
        kind: invited ? "shared" : "personal", completion_mode: "personal", status: "upcoming",
        membership_status: "accepted", is_owner: true, completed_for_me: false,
        participants_count: 1, completed_count: 0, members: [
            { id: "settings-fixture", nick: "settingsfixture", username: "Settings Fixture",
                avatar_url: null, status: "accepted", is_owner: true, completed: false },
            ...(invited && !removed ? [{ id: contactId, nick: "testmember", username: "Test Member",
                avatar_url: null, status: "pending", is_owner: false, completed: false }] : [])
        ]
    });
    await page.route("**/api/plans", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, plans: [] })
    }));
    await page.route("**/api/plans/7", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, plan: currentPlan() })
    }));
    await page.route("**/api/plans/7/invite", route => {
        invited = true;
        return route.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify({ success: true }) });
    });
    await page.route(`**/api/plans/7/members/${contactId}`, route => {
        removed = true;
        return route.fulfill({ status: 200, contentType: "application/json",
            body: JSON.stringify({ success: true }) });
    });
    await page.route("**/api/contacts", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, friendsArr: [
            { id: contactId, nick: "testmember", name: "Test Member",
                avatar_url: null, is_group: false, pinned: false, note: true,
                is_blocked: false, unread_count: 0, lastMessage: null }
        ] })
    }));

    await page.goto("/plan/7");
    const section = page.locator(".planMembersSection");
    await expect(section).toBeVisible();
    await expect(section.locator(".planMember")).toHaveCount(1);
    await section.getByRole("button", { name: "Добавить участника" }).click();
    await expect(section.locator(".planInviteContact")).toHaveCount(1);
    await section.locator(".planInviteContact").click();
    await section.getByRole("button", { name: "Пригласить" }).click();
    await expect.poll(() => invited).toBe(true);
    await expect(section.locator(".planMember")).toHaveCount(2);
    await expect(section).toContainText("Ожидает приглашение");
    await section.getByRole("button", { name: "Отменить приглашение" }).first().click();
    await section.getByRole("button", { name: "Отменить приглашение" }).last().click();
    await expect.poll(() => removed).toBe(true);
    await expect(section.locator(".planMember")).toHaveCount(1);
});

test("mobile settings buttons allow swiping SideMenu open", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "webkit-mobile", "Mobile gesture only");
    await page.goto("/settings");
    const button = page.locator(".settingsButtsWrapper .settingButt").first();
    await expect(button).toBeVisible();
    const menu = page.locator(".mobile-layout > .sideMenu");
    await expect(menu).not.toHaveClass(/open/);
    await button.evaluate(element => {
        const touch = (x: number) => new Touch({
            identifier: 1, target: element, clientX: x, clientY: 300
        });
        const fire = (type: string, x: number) => {
            const point = touch(x);
            element.dispatchEvent(new TouchEvent(type, {
                bubbles: true, cancelable: true,
                touches: type === "touchend" ? [] : [point],
                targetTouches: type === "touchend" ? [] : [point],
                changedTouches: [point]
            }));
        };
        fire("touchstart", 30);
        fire("touchmove", 90);
        fire("touchmove", 185);
        fire("touchend", 185);
    });
    await expect(menu).toHaveClass(/open/);
    await expect(page).toHaveURL(/\/settings\/?$/);
});

test("SelectList opens above near the bottom and below near the top", async ({ page }) => {
    await page.route("**/api/settings/plan-reminders", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ success: true, preferences: { enabled: true, defaultMinutesBefore: 60 } })
    }));
    await page.goto("/settings/notes");
    const control = page.locator(".planReminderSelect");
    const menu = control.locator(".selectList");
    await expect(control).toBeVisible();

    // Keep the real React SelectList, only pin its location for deterministic viewport bounds.
    await control.evaluate(element => {
        element.style.position = "fixed";
        element.style.top = "calc(100dvh - 94px)";
        element.style.left = "15px";
        element.style.width = "320px";
        element.style.zIndex = "100";
    });
    await control.locator("input").evaluate(element => (element as HTMLInputElement).click());
    await expect(menu).toHaveClass(/active/);
    await expect(control).toHaveClass(/openUp/);
    const above = await menu.boundingBox();
    const bottomInput = await control.locator("input").boundingBox();
    expect(above).not.toBeNull();
    expect(bottomInput).not.toBeNull();
    expect(above!.y + above!.height).toBeLessThan(bottomInput!.y);
    await control.locator("input").evaluate(element => (element as HTMLInputElement).click());
    await expect(menu).not.toHaveClass(/active/);

    await control.evaluate(element => {
        element.style.top = "90px";
        // Fixed descendants of transformed settings sliders can be offset
        // from the visual viewport; normalize the actual screen coordinate.
        const rect = element.getBoundingClientRect();
        element.style.transform = `translateY(${90 - rect.top}px)`;
    });
    await expect.poll(() => control.evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(90);
    await control.locator("input").evaluate(element => (element as HTMLInputElement).click());
    await expect(menu).toHaveClass(/active/);
    await expect(control).not.toHaveClass(/openUp/);
    const below = await menu.boundingBox();
    const topInput = await control.locator("input").boundingBox();
    expect(below).not.toBeNull();
    expect(topInput).not.toBeNull();
    expect(below!.y).toBeGreaterThanOrEqual(topInput!.y + topInput!.height - 1);
});
