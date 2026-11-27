import { useEffect } from "react";

export function isIosStandalone() {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return ios && (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

function editableFocused() {
    const element = document.activeElement;
    return element instanceof HTMLElement &&
        (element.isContentEditable || element.matches("textarea:not([readonly]):not([disabled]), input:not([readonly]):not([disabled]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=file]):not([type=range]):not([type=submit]):not([type=color]):not([type=hidden])"));
}

export function useVisualViewport() {
    useEffect(() => {
        const viewport = window.visualViewport;
        const root = document.documentElement;
        const mobile = window.matchMedia("(pointer: coarse)");
        const standalone = isIosStandalone();
        if (standalone) root.dataset.iosPwa = "true";

        let closedHeight = window.innerHeight;
        let lastWidth = window.innerWidth;
        let frame = 0;
        let settleTimer: ReturnType<typeof setTimeout> | undefined;
        const update = () => {
            const height = viewport?.height ?? window.innerHeight;
            const top = viewport?.offsetTop ?? 0;
            if (Math.abs(window.innerWidth - lastWidth) > 80) {
                lastWidth = window.innerWidth;
                closedHeight = window.innerHeight;
            }
            const keyboard = mobile.matches && Math.abs((viewport?.scale ?? 1) - 1) < .02 &&
                Math.max(closedHeight, window.innerHeight) - height > 120;
            if (!editableFocused() && !keyboard && height >= window.innerHeight - 8) {
                closedHeight = window.innerHeight;
            }
            if (keyboard) root.dataset.atKeyboard = "true";
            else delete root.dataset.atKeyboard;

            root.style.setProperty("--vv-height", `${Math.floor(height)}px`);
            root.style.setProperty("--vv-top", `${top}px`);
            root.style.setProperty("--at-app-height", `${Math.floor(keyboard ? height : Math.min(window.innerHeight, height))}px`);

            // Trust the actual visible viewport, not screen.height. A Home Screen
            // web view can be physically shorter than the display on iOS.
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(update);
        };
        const settle = () => {
            schedule();
            clearTimeout(settleTimer);
            settleTimer = setTimeout(() => {
                if (!editableFocused() && standalone && !root.dataset.atKeyboard && window.scrollY !== 0) {
                    window.scrollTo(0, 0);
                }
                schedule();
            }, 350);
        };

        update();
        viewport?.addEventListener("resize", schedule);
        viewport?.addEventListener("scroll", schedule);
        window.addEventListener("resize", schedule);
        window.addEventListener("orientationchange", settle);
        window.addEventListener("pageshow", settle);
        document.addEventListener("focusin", schedule);
        document.addEventListener("focusout", settle);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(settleTimer);
            viewport?.removeEventListener("resize", schedule);
            viewport?.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            window.removeEventListener("orientationchange", settle);
            window.removeEventListener("pageshow", settle);
            document.removeEventListener("focusin", schedule);
            document.removeEventListener("focusout", settle);
            delete root.dataset.iosPwa;
            delete root.dataset.atKeyboard;
            ["--vv-height", "--vv-top", "--at-app-height"].forEach(name => root.style.removeProperty(name));
        };
    }, []);
}
