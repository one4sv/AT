import { useEffect, useRef } from "react";
import { useChat } from "../ChatHook";
import { useContextMenu } from "../ContextMenuHook";
import { useSideMenu } from "../SideMenuHook";

type HeaderGesture = "quick" | "chat";
type PressState = {
    x: number;
    y: number;
    active: boolean;
    kind: HeaderGesture | null;
    timer: ReturnType<typeof setTimeout> | null;
    pointerId?: number;
    trigger: HTMLElement;
};

export default function useHeaderMenuGestures() {
    const { chatWith } = useChat();
    const { openMenu, closeMenu } = useContextMenu();
    const { setDontHandle, setDontHandleOther } = useSideMenu();
    const handlers = useRef({ chatWith, openMenu, closeMenu, setDontHandle, setDontHandleOther });
    handlers.current = { chatWith, openMenu, closeMenu, setDontHandle, setDontHandleOther };

    useEffect(() => {
        let press: PressState | null = null;
        let hovered: HTMLElement | null = null;
        let suppressUntil = 0;
        let touchSuppressUntil = 0;

        const clearHover = () => {
            hovered?.classList.remove("touchHover");
            hovered = null;
        };

        const clearTimer = () => {
            if (press?.timer) clearTimeout(press.timer);
            if (press) press.timer = null;
        };

        const unlock = () => {
            handlers.current.setDontHandle(false);
            handlers.current.setDontHandleOther(false);
        };

        const reset = (close = false) => {
            clearTimer();
            clearHover();
            press = null;
            unlock();
            if (close) handlers.current.closeMenu();
        };

        const findTrigger = (x: number, y: number) => {
            const target = document.elementFromPoint(x, y);
            const exact = target?.closest<HTMLElement>("[data-header-gesture]");
            if (exact) return exact;

            // A finger sliding across the header should not have to hit a 5dvh icon.
            const header = Array.from(document.querySelectorAll<HTMLElement>(".headerDiv"))
                .find(element => {
                    const rect = element.getBoundingClientRect();
                    return y >= rect.top - 18 && y <= rect.bottom + 18 &&
                        x >= rect.left - 12 && x <= rect.right + 12;
                });
            if (!header) return null;

            const buttons = Array.from(header.querySelectorAll<HTMLElement>("[data-header-gesture]"));
            return buttons.sort((a, b) => {
                const ar = a.getBoundingClientRect();
                const br = b.getBoundingClientRect();
                return Math.abs(ar.left + ar.width / 2 - x) - Math.abs(br.left + br.width / 2 - x);
            })[0] ?? null;
        };

        const open = (trigger: HTMLElement) => {
            if (!press) return;
            const kind = trigger.dataset.headerGesture as HeaderGesture | undefined;
            if (!kind || (press.active && press.kind === kind)) return;

            const { chatWith, openMenu } = handlers.current;
            const rect = trigger.getBoundingClientRect();
            const x = kind === "chat" ? Math.max(10, rect.right - 240) : rect.left;
            const y = rect.bottom + 6;

            if (kind === "chat") {
                if (!chatWith) return;
                openMenu(x, y, "acc", {
                    id: chatWith.id,
                    name: chatWith.name || chatWith.nick,
                    nick: chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick
                }, undefined, {
                    note: chatWith.note,
                    is_blocked: chatWith.is_blocked,
                    pinned: chatWith.pinned,
                    is_group: chatWith.is_group
                });
            } else {
                openMenu(x, y, "headerQuickAction", { id: "headerQuickAction" });
            }
            press.kind = kind;
            press.active = true;
            suppressUntil = performance.now() + 1100;
            handlers.current.setDontHandle(true);
            handlers.current.setDontHandleOther(true);
        };

        const start = (x: number, y: number, pointerId?: number, target?: Element | null) => {
            if (press) reset();
            // A gesture may start only on an actual header control, not on its expanded hit area.
            const trigger = target?.closest<HTMLElement>("[data-header-gesture]") ??
                (pointerId !== undefined ? findTrigger(x, y) : null);
            if (!trigger) return false;
            press = { x, y, active: false, kind: null, pointerId, timer: null, trigger };
            const current = press;
            current.timer = setTimeout(() => {
                if (press !== current || !trigger.isConnected) return;
                open(trigger);
            }, 350);
            return true;
        };

        const move = (x: number, y: number) => {
            if (!press) return;
            if (!press.active) {
                // Allow a small finger drift before the 350ms hold expires.
                if (Math.hypot(x - press.x, y - press.y) > 26) reset();
                return;
            }

            const target = document.elementFromPoint(x, y);
            const item = target?.closest<HTMLElement>(".ContextMenuButt") ?? null;
            if (item !== hovered) {
                clearHover();
                hovered = item;
                hovered?.classList.add("touchHover");
            }

            if (!item) {
                const trigger = findTrigger(x, y);
                if (trigger) open(trigger);
            }
        };

        const end = (x: number, y: number, cancelled: boolean, touch = false) => {
            if (!press) return;
            const wasActive = press.active;
            const original = press.trigger;
            const target = document.elementFromPoint(x, y);
            const item = !cancelled && wasActive ? target?.closest<HTMLElement>(".ContextMenuWrapper .ContextMenuButt") : null;
            const shortTap = !cancelled && !wasActive &&
                target?.closest("[data-header-gesture]") === original &&
                Math.hypot(x - press.x, y - press.y) < 26;

            if (touch || wasActive) suppressUntil = performance.now() + 1100;
            reset(wasActive && !item);

            if (item) {
                item.click();
            } else if (touch && shortTap && original.isConnected) {
                // touchstart.preventDefault() suppresses the browser's delayed synthetic click.
                // Dispatch one click ourselves only for a genuine short tap.
                original.click();
            }
        };

        const touchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1) return;
            const target = event.target instanceof Element ? event.target : null;
            const trigger = target?.closest<HTMLElement>("[data-header-gesture]");
            if (!trigger) return;

            const touch = event.touches[0];
            if (!start(touch.clientX, touch.clientY, undefined, trigger)) return;

            // iOS Safari otherwise generates contextmenu/click after finger release.
            // Own the entire touch lifecycle from touchstart, like SMnav.
            touchSuppressUntil = performance.now() + 1200;
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
        };

        const touchMove = (event: TouchEvent) => {
            if (!press) return;
            if (event.touches.length !== 1) { reset(true); return; }
            const touch = event.touches[0];
            const active = press.active;
            move(touch.clientX, touch.clientY);
            event.stopPropagation();
            if (active || press?.active) {
                if (event.cancelable) event.preventDefault();
            }
        };

        const touchEnd = (event: TouchEvent) => {
            if (!press) return;
            const touch = event.changedTouches[0];
            event.stopPropagation();
            if (touch) end(touch.clientX, touch.clientY, false, true);
            else reset(true);
        };

        const touchCancel = (event: TouchEvent) => {
            if (!press) return;
            event.stopPropagation();
            end(press.x, press.y, true, true);
        };

        const pointerDown = (event: PointerEvent) => {
            if (event.pointerType === "touch" || !event.isPrimary) return;
            start(event.clientX, event.clientY, event.pointerId);
        };

        const pointerMove = (event: PointerEvent) => {
            if (event.pointerType === "touch" || !press || press.pointerId !== event.pointerId) return;
            move(event.clientX, event.clientY);
        };

        const pointerEnd = (event: PointerEvent) => {
            if (event.pointerType === "touch" || !press || press.pointerId !== event.pointerId) return;
            end(event.clientX, event.clientY, event.type === "pointercancel");
        };

        const suppress = (event: MouseEvent) => {
            if (!event.isTrusted || performance.now() > suppressUntil) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        const suppressNativeContext = (event: MouseEvent) => {
            if (!event.isTrusted || performance.now() > touchSuppressUntil) return;
            const target = event.target instanceof Element ? event.target : null;
            if (!press && !target?.closest("[data-header-gesture]")) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        document.addEventListener("touchstart", touchStart, { capture: true, passive: false });
        document.addEventListener("touchmove", touchMove, { capture: true, passive: false });
        document.addEventListener("touchend", touchEnd, true);
        document.addEventListener("touchcancel", touchCancel, true);
        document.addEventListener("pointerdown", pointerDown, true);
        document.addEventListener("pointermove", pointerMove, true);
        document.addEventListener("pointerup", pointerEnd, true);
        document.addEventListener("pointercancel", pointerEnd, true);
        document.addEventListener("click", suppress, true);
        document.addEventListener("contextmenu", suppressNativeContext, true);

        return () => {
            reset();
            document.removeEventListener("touchstart", touchStart, true);
            document.removeEventListener("touchmove", touchMove, true);
            document.removeEventListener("touchend", touchEnd, true);
            document.removeEventListener("touchcancel", touchCancel, true);
            document.removeEventListener("pointerdown", pointerDown, true);
            document.removeEventListener("pointermove", pointerMove, true);
            document.removeEventListener("pointerup", pointerEnd, true);
            document.removeEventListener("pointercancel", pointerEnd, true);
            document.removeEventListener("click", suppress, true);
            document.removeEventListener("contextmenu", suppressNativeContext, true);
        };
    }, []);
}
