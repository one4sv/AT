import { useEffect } from "react";
import { useSettings } from "./SettingsHook"; // путь твой

export default function ThemeHandler() {
  const { theme, acsent, decor } = useSettings();

  function getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  useEffect(() => {
    if (!theme || !acsent) return;

    document.documentElement.setAttribute("data-acsent", acsent);
    document.documentElement.setAttribute("data-decor", decor);

    // custom: если нужно — брать из настроек/localStorage и выставлять инлайн-переменные
    if (acsent === "custom") {
      try {
        const stored = localStorage.getItem("customAcsent"); // { acsent: "#...", darkerAcsent: "#..." }
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.acsent) document.documentElement.style.setProperty("--acsent", parsed.acsent);
          if (parsed.darkerAcsent) document.documentElement.style.setProperty("--darkerAcsent", parsed.darkerAcsent);
        }
      } catch (e) {
        console.error("custom acsent parse error", e);
      }
    } else {
      // при смене предустановленного акцента можно удалить инлайн если были ранее установлены
      document.documentElement.style.removeProperty("--acsent");
      document.documentElement.style.removeProperty("--darkerAcsent");
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
  }, [acsent, theme, decor]);

  return null;
}
