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
            applyCustomPalette(accent, grad);
        };
        setTheme();
        if (theme !== "system") return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener("change", setTheme);
        return () => media.removeEventListener("change", setTheme);
    }, [theme, accent, grad, decor, blur]);
    return null;
}
