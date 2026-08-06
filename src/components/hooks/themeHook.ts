import { useEffect } from "react";
import { useSettings } from "./SettingsHook"; // путь твой

export default function ThemeHandler() {
  const { theme, accent, decor } = useSettings();

  function getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  useEffect(() => {
    if (!theme || !accent) return;

    document.documentElement.setAttribute("data-accent", accent);
    document.documentElement.setAttribute("data-decor", decor);

    // custom: если нужно — брать из настроек/localStorage и выставлять инлайн-переменные
    if (accent === "custom") {
      try {
        const stored = localStorage.getItem("customAccent"); // { accent: "#...", darkerAccent: "#..." }
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.accent) document.documentElement.style.setProperty("--accent", parsed.accent);
          if (parsed.darkerAccent) document.documentElement.style.setProperty("--darkerAccent", parsed.darkerAccent);
        }
      } catch (e) {
        console.error("custom accent parse error", e);
      }
    } else {
      // при смене предустановленного акцента можно удалить инлайн если были ранее установлены
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--darkerAccent");
    }

    if (theme === "system") {
      document.documentElement.setAttribute("data-theme", getSystemTheme());

      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [accent, theme, decor]);

  return null;
}
