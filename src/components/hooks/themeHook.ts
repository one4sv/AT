import { useEffect } from "react";
import { useSettings } from "./SettingsHook";
import { applyCustomPalette } from "../ts/utils/customPalette";
export default function ThemeHandler() {
    const { theme, accent, grad, decor, blur } = useSettings();
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-accent", accent);
        root.setAttribute("data-grad", grad);
        root.setAttribute("data-decor", decor);
        root.style.setProperty("--blur", `${blur}px`);
        const setTheme = () => {
            root.setAttribute("data-theme", theme === "system"
                ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                : theme);
            root.style.colorScheme = root.dataset.theme === "light" ? "light" : "dark";
            applyCustomPalette(accent, grad);
            const background = getComputedStyle(root).getPropertyValue("--bgc").trim();
            if (background) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
        };
        setTheme();
        if (theme !== "system") return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener("change", setTheme);
        return () => media.removeEventListener("change", setTheme);
    }, [theme, accent, grad, decor, blur]);
    return null;
}
