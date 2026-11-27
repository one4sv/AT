import { useEffect, useRef, type RefObject } from "react";

type SwipeContextMenuArgs = {
    closeMenu: () => void;
    menuRef: RefObject<HTMLDivElement | null>;
    edgeSourceRef: RefObject<HTMLElement | null>;
    highlightContextEdges: boolean;
};

const edgeSize = 44;
const edgeDelay = 300;
const edgeRepeatDelay = 650;
const contextTrigger = "[data-context-menu]";
const scrollSurfaces = ".sideMenu .slide, .settingsDiv .settingsButtsWrapper, .settingsDiv .settingTab, .settingsDiv .searchReveal, .settingsDiv .buttsScroll, .chat, .chatMediaBody.active, .backgroundLibraryScroll, .wallpaperStudioScroll, .accDiv .accContentSlide";

export default function useLongPressContextMenu(options: SwipeContextMenuArgs) {
    const latest = useRef(options);
    latest.current = options;

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
        let scrollSurface: HTMLElement | null = null;
        let edgeFrame = 0;
        let edgeDirection = 0;
        let nextEdgeStep = 0;
        let edgeChanged = false;
        let stepWithoutMove = false;
        let zones: HTMLDivElement[] = [];

        const stopEdgeScroll = () => {
            cancelAnimationFrame(edgeFrame);
            edgeFrame = 0;
            edgeDirection = 0;
            edgeChanged = false;
            stepWithoutMove = false;
            scrollSurface?.removeAttribute("data-context-edge-scroll");
            scrollSurface = null;
            zones.forEach(zone => zone.remove());
            zones = [];
        };

        const getListTriggers = (surface: HTMLElement) =>
            [...surface.querySelectorAll<HTMLElement>(contextTrigger)].filter(element =>
                element.closest(scrollSurfaces) === surface &&
                !surface.contains(element.parentElement?.closest(contextTrigger) ?? null) &&
                !element.matches(".chatMediaEntity, :disabled, [aria-disabled=true]") &&
                element.getClientRects().length > 0
            );

        const stepToNeighbor = (surface: HTMLElement, direction: number) => {
            if (!press) return;
            const current = press.target;
            const items = getListTriggers(surface);
            const index = items.findIndex(item => item.contains(current));
            const next = index < 0 ? undefined : items[index + direction];
            if (!next) return;

            const bounds = surface.getBoundingClientRect();
            const item = next.getBoundingClientRect();
            const top = Math.max(0, bounds.top);
            const bottom = Math.min(window.innerHeight, bounds.bottom);
            if (item.top < top || item.bottom > bottom) {
                surface.scrollTop += item.top + item.height / 2 - (top + bottom) / 2;
            }

            const visible = next.getBoundingClientRect();
            press.target = next;
            edgeChanged = true;
            stepWithoutMove = true;
            clearHover();
            const { edgeSourceRef } = latest.current;
            edgeSourceRef.current = next;
            try {
                next.dispatchEvent(new MouseEvent("contextmenu", {
                    bubbles: true, cancelable: true,
                    clientX: visible.left + visible.width / 2,
                    clientY: Math.max(top, Math.min(bottom, visible.top + visible.height / 2))
                }));
            } finally {
                edgeSourceRef.current = null;
            }
        };

        const tickEdgeScroll = (now: number) => {
            const { menuRef } = latest.current;
            if (!press?.triggered || !scrollSurface?.isConnected || !menuRef.current?.isConnected) {
                stopEdgeScroll();
                return;
            }
            const viewport = window.visualViewport;
            const offset = viewport?.offsetLeft ?? 0;
            const size = viewport?.width ?? window.innerWidth;
            const coordinate = press.x - offset;
            const target = document.elementFromPoint(press.x, press.y);
            const direction = target?.closest(".ContextMenuWrapper, .selectListPortalRoot") ? 0 :
                coordinate < edgeSize ? -1 : coordinate > size - edgeSize ? 1 : 0;
            if (direction !== edgeDirection) {
                edgeDirection = direction;
                nextEdgeStep = now + edgeDelay;
            }
            zones.forEach((zone, index) => zone.classList.toggle("active", direction === (index === 0 ? -1 : 1)));
            if (direction && now >= nextEdgeStep) {
                stepToNeighbor(scrollSurface, direction);
                nextEdgeStep = now + edgeRepeatDelay;
            }
            edgeFrame = requestAnimationFrame(tickEdgeScroll);
        };

        const startEdgeScroll = (target: HTMLElement) => {
            if (target.closest("[data-calendar-date]")) return;
            const surface = target.closest<HTMLElement>(scrollSurfaces);
            if (!surface || getListTriggers(surface).length < 2) return;
            scrollSurface = surface;

            scrollSurface.setAttribute("data-context-edge-scroll", "");
            if (latest.current.highlightContextEdges) {
                zones = ["left", "right"].map(edge => {
                    const zone = document.createElement("div");
                    zone.className = `contextScrollZone ${edge}`;
                    zone.setAttribute("aria-hidden", "true");
                    document.body.append(zone);
                    return zone;
                });
            }
            edgeFrame = requestAnimationFrame(() => { edgeFrame = requestAnimationFrame(tickEdgeScroll); });
        };

        const clearHover = () => {
            hovered?.classList.remove("touchHover");
            hovered = null;
        };

        const cancel = (close = false) => {
            if (press?.timer) clearTimeout(press.timer);
            stopEdgeScroll();
            document.documentElement.classList.remove("contextMenuPress");
            press = null;
            clearHover();
            if (close) latest.current.closeMenu();
        };

        const down = (event: PointerEvent) => {
            if ((event.pointerType !== "touch" && event.pointerType !== "pen") || !event.isPrimary) return;
            const target = event.target instanceof Element ? event.target : null;
            if (target?.closest(".contextMessageSelectable")) return;
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
                window.dispatchEvent(new Event("at-context-gesture-start"));
                suppressUntil = performance.now() + 1400;
                current.target.dispatchEvent(new MouseEvent("contextmenu", {
                    bubbles: true, cancelable: true, clientX: current.x, clientY: current.y
                }));
                startEdgeScroll(current.target);
            }, 350);
        };

        const move = (event: PointerEvent) => {
            if (!press || event.pointerId !== press.id) return;
            if (press.x !== event.clientX || press.y !== event.clientY) stepWithoutMove = false;
            press.x = event.clientX;
            press.y = event.clientY;

            if (!press.triggered) {
                const dx = event.clientX - press.startX;
                const dy = event.clientY - press.startY;
                // Match MobileLayout's 8px axis arbitration for every ordinary
                // context-menu surface (posts, messages, settings cards, etc.).
                // Otherwise the menu timer can fire during a slow swipe.
                const verticalThreshold = press.target.closest(".accDiv, .sideMenu") ? 8 : 18;
                if ((Math.abs(dy) >= verticalThreshold && Math.abs(dy) >= Math.abs(dx)) ||
                    (Math.abs(dx) >= 8 && Math.abs(dx) > Math.abs(dy))) cancel();
                return;
            }

            const target = document.elementFromPoint(event.clientX, event.clientY);
            if(press.target.hasAttribute("data-calendar-date"))window.dispatchEvent(new CustomEvent("calendar-context-move",{detail:{x:event.clientX,y:event.clientY}}));
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
            const item = active && !stepWithoutMove ? target?.closest<HTMLElement>(".ContextMenuWrapper .ContextMenuButt") : null;
            const distance = Math.hypot(event.clientX - press.startX, event.clientY - press.startY);
            // An unmoved release must not choose an item, even when the
            // highlighted preview sits over a separate dimming layer.
            const calendarPreview=origin.hasAttribute("data-calendar-date") && !!target?.closest("[data-calendar-preview-day]");
            const onOrigin = (edgeChanged && (edgeDirection !== 0 || stepWithoutMove)) || distance < 24 || target === origin || !!(target && origin.contains(target)) || calendarPreview;
            if(origin.hasAttribute("data-calendar-date"))window.dispatchEvent(new Event("calendar-context-end"));
            if (active) suppressUntil = performance.now() + 1400;
            cancel(event.type === "pointercancel" || active && !item && !onOrigin);
            // Only an intentional move onto a menu item selects it on release.
            if (event.type !== "pointercancel" && active && item && distance >= 24) item.click();
        };

        const suppress = (event: MouseEvent) => {
            if (!event.isTrusted || performance.now() >= suppressUntil) return;
            if (event.target instanceof Element && event.target.closest(".contextMessageSelectable")) return;
            // Block the release-generated ghost click, but allow a deliberate
            // second tap on an opened menu item immediately after long-press.
            if (event.type === "click" && event.target instanceof Element &&
                event.target.closest(".ContextMenuWrapper, .selectListPortalRoot.calendarContextActivity")) return;
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
