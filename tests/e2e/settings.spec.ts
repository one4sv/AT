import { test, expect } from "@playwright/test";

// These tests use a synthetic account response. They never modify production data,
// send account-deletion emails or depend on a real user's cookies.
test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("at-cookie-consent-v1", "necessary"));
    await page.route("**/api/user", route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
            success: true, id: "settings-fixture", nick: "settingsfixture",
            username: "Settings Fixture", mail: "fixture@example.invalid",
            bio: "", avatar_url: null, date_of_birth: "2005-01-01",
            last_online: new Date().toISOString()
        })
    }));
});

test("device-local font, date and time preferences survive a reload", async ({ page }) => {
    await page.goto("/settings/gen");
    await expect(page.locator('[data-setting-id="fontSize"]')).toBeVisible();
    // Wait for the synthetic user to finish loading before setting account-scoped values.
    await expect.poll(() => page.evaluate(() => localStorage.getItem("settingsfixture_settings_font_size"))).not.toBeNull();
    await page.evaluate(() => {
        localStorage.setItem("settingsfixture_settings_font_size", "20");
        localStorage.setItem("settingsfixture_settings_date_format", JSON.stringify("american"));
        localStorage.setItem("settingsfixture_settings_time_format", JSON.stringify("twelve"));
    });
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
