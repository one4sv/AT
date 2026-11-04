export function getHeaderScrollTarget(pathname: string): HTMLElement | null {
    if (pathname.startsWith("/info/") || pathname.startsWith("/settings/")) {
        return document.querySelector<HTMLElement>(".settingsSlider > .settingsPage:nth-child(2) .settingTab");
    }

    if (pathname === "/info" || pathname === "/settings") {
        return document.querySelector<HTMLElement>(".settingsSlider > .settingsPage:first-child .settingsButtsWrapper");
    }

    if (pathname.startsWith("/acc")) {
        const slides = document.querySelector<HTMLElement>(".accContent");
        if (!slides) return null;

        const index = slides.clientWidth
            ? Math.round(slides.scrollLeft / slides.clientWidth)
            : 0;

        return slides.querySelectorAll<HTMLElement>(".accContentSlide")[index] ?? null;
    }

    const selectors = pathname === "/"
        ? [".postFeed"]
        : pathname === "/habit"
            ? [".StatsDivMain"]
            : pathname.startsWith("/post/")
                ? [".postPageScroll"]
                : [".page-content"];

    for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector);
        if (element) return element;
    }

    return null;
}
