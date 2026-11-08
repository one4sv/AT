import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: ".",
    testMatch: ["*.spec.ts"],
    timeout: 30000,
    use: {
        baseURL: process.env.AT_E2E_BASE_URL || "http://127.0.0.1:5173",
        storageState: process.env.AT_E2E_STORAGE_STATE || undefined,
        trace: "retain-on-failure",
        screenshot: "only-on-failure"
    },
    projects: [
        { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit-mobile", use: { ...devices["iPhone 13"] } }
    ]
});
