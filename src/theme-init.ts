(() => {
    try {
        const theme = JSON.parse(
            localStorage.getItem("settings_theme") ?? '"system"'
        );

        const accent = JSON.parse(
            localStorage.getItem("settings_accent") ?? '"poison"'
        );

        const grad = JSON.parse(
            localStorage.getItem("settings_grad") ?? '"meadow"'
        );

        const decor = JSON.parse(
            localStorage.getItem("settings_decor") ?? '"default"'
        );

        const systemDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

        const realTheme =
            theme === "system"
                ? (systemDark ? "dark" : "light")
                : theme;

        document.documentElement.setAttribute(
            "data-theme",
            realTheme
        );

        document.documentElement.setAttribute(
            "data-accent",
            accent
        );

        document.documentElement.setAttribute(
            "data-grad",
            grad
        );

        document.documentElement.setAttribute(
            "data-decor",
            decor
        );
    } catch (e) {
        console.error(e);
    }
})();