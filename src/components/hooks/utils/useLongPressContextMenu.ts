import { useEffect, useRef, type RefObject } from "react";

type SwipeContextMenuArgs = {
    closeMenu: () => void;
    menuRef: RefObject<HTMLDivElement | null>;
};

export default function useLongPressContextMenu({ closeMenu, menuRef }: SwipeContextMenuArgs) {
    const latest = useRef({ closeMenu, menuRef });
    latest.current = { closeMenu, menuRef };

    useEffect(() => {
        let press: {
            id: number;
            x: number;
            y: number;
            startX: number;
            startY: number;
            target: HTMLElement;
            triggered: boolean;
            timer: ReturnType<typeof setTimeout> | null;
        } | null = null;
        let hovered: HTMLElement | null = null;
        let suppressUntil = 0;

        const clearHover = () => {
            hovered?.classList.remove("touchHover");
            hovered = null;
        };

        const cancel = (close = false) => {
            if (press?.timer) clearTimeout(press.timer);
            document.documentElement.classList.remove("contextMenuPress");
            press = null;
            clearHover();
            if (close) latest.current.closeMenu();
        };

        const down = (event: PointerEvent) => {
            if ((event.pointerType !== "touch" && event.pointerType !== "pen") || !event.isPrimary) return;
            const target = event.target instanceof Element ? event.target : null;
            const element = target?.closest<HTMLElement>("[data-context-menu]");
            if (!element || target?.closest("input, textarea, select, [contenteditable=true], [data-header-gesture]") ||
                target?.closest("button") && !element.hasAttribute("data-context-menu-allow-button")) return;
            cancel();
            document.documentElement.classList.add("contextMenuPress");
            press = {
                id: event.pointerId, x: event.clientX, y: event.clientY,
                startX: event.clientX, startY: event.clientY,
                target: element, triggered: false, timer: null
            };
            const current = press;
            current.timer = setTimeout(() => {
                if (press !== current || !current.target.isConnected) return;
                current.triggered = true;
                suppressUntil = performance.now() + 1400;
                current.target.dispatchEvent(new MouseEvent("contextmenu", {
                    bubbles: true, cancelable: true, clientX: current.x, clientY: current.y
                }));
            }, 350);
        };

        const move = (event: PointerEvent) => {
            if (!press || event.pointerId !== press.id) return;
            press.x = event.clientX;
            press.y = event.clientY;

            if (!press.triggered) {
                const dx = event.clientX - press.startX;
                const dy = event.clientY - press.startY;
                // Match MobileLayout's 8px axis arbitration for every ordinary
                // context-menu surface (posts, messages, settings cards, etc.).
                // Otherwise the menu timer can fire during a slow swipe.
                if ((Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) ||
                    (Math.abs(dx) >= 8 && Math.abs(dx) > Math.abs(dy))) cancel();
                return;
            }

            const target = document.elementFromPoint(event.clientX, event.clientY);
            const item = target?.closest<HTMLElement>(".ContextMenuWrapper .ContextMenuButt") ?? null;
            if (item !== hovered) {
                clearHover();
                hovered = item;
                hovered?.classList.add("touchHover");
            }
        };

        const touchMove = (event: TouchEvent) => {
            if (press?.triggered && event.cancelable) event.preventDefault();
        };

        const up = (event: PointerEvent) => {
            if (!press || event.pointerId !== press.id) return;
            const active = press.triggered;
            const origin = press.target;
            const target = document.elementFromPoint(event.clientX, event.clientY);
            const item = active ? target?.closest<HTMLElement>(".ContextMenuWrapper .ContextMenuButt") : null;
            const distance = Math.hypot(event.clientX - press.startX, event.clientY - press.startY);
            // An unmoved release must not choose an item, even when the
            // highlighted preview sits over a separate dimming layer.
            const onOrigin = distance < 24 || target === origin || !!(target && origin.contains(target));
            if (active) suppressUntil = performance.now() + 1400;
            cancel(event.type === "pointercancel" || active && !item && !onOrigin);
            // Only an intentional move onto a menu item selects it on release.
            if (active && item && distance >= 24) item.click();
        };

        const suppress = (event: MouseEvent) => {
            if (!event.isTrusted || performance.now() >= suppressUntil) return;
            // Block the release-generated ghost click, but allow a deliberate
            // second tap on an opened menu item immediately after long-press.
            if (event.type === "click" && event.target instanceof Element &&
                event.target.closest(".ContextMenuWrapper")) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        const stopSelection = (event: Event) => {
            if (press?.target.isConnected && event.cancelable) event.preventDefault();
        };

        document.addEventListener("selectstart", stopSelection, true);
        document.addEventListener("pointerdown", down, true);
        document.addEventListener("pointermove", move, true);
        document.addEventListener("pointerup", up, true);
        document.addEventListener("pointercancel", up, true);
        document.addEventListener("touchmove", touchMove, { capture: true, passive: false });
        document.addEventListener("click", suppress, true);
        document.addEventListener("contextmenu", suppress, true);
        return () => {
            cancel();
            document.removeEventListener("selectstart", stopSelection, true);
            document.removeEventListener("pointerdown", down, true);
            document.removeEventListener("pointermove", move, true);
            document.removeEventListener("pointerup", up, true);
            document.removeEventListener("pointercancel", up, true);
            document.removeEventListener("touchmove", touchMove, true);
            document.removeEventListener("click", suppress, true);
            document.removeEventListener("contextmenu", suppress, true);
        };
    }, []);
}
