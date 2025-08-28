import { useEffect } from "react";
import { useSettings } from "./SettingsHook"; // путь твой

export default function ThemeHandler() {
  const { theme, acsent } = useSettings();

  useEffect(() => {
    if (!theme) return;

    function getSystemTheme(): "light" | "dark" {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    if (theme === "system") {
      const sysTheme = getSystemTheme();
      document.documentElement.setAttribute("data-theme", sysTheme);

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
  }, [theme]);

  return null;
}
