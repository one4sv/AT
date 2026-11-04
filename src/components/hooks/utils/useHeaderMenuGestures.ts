import { useEffect, useRef, type TouchEvent } from "react";
import { useChat } from "../ChatHook";
import { useContextMenu } from "../ContextMenuHook";
import { useSideMenu } from "../SideMenuHook";

type HeaderGesture = "quick" | "chat" | "habit";

type PressState = {
    id: number;
    x: number;
    y: number;
    original: HTMLElement;
    held: boolean;
    kind: HeaderGesture | null;
    timer: ReturnType<typeof setTimeout> | null;
};

export default function useHeaderMenuGestures() {
    const { chatWith } = useChat();
    const { openMenu, closeMenu } = useContextMenu();
    const { setDontHandle, setDontHandleOther } = useSideMenu();

    const handlers = useRef({ chatWith, openMenu, closeMenu, setDontHandle, setDontHandleOther });
    handlers.current = { chatWith, openMenu, closeMenu, setDontHandle, setDontHandleOther };

    const state = useRef<PressState | null>(null);
    const hovered = useRef<HTMLElement | null>(null);
    const selectedTrigger = useRef<HTMLElement | null>(null);
    const suppressUntil = useRef(0);

    const clearHover = () => {
        hovered.current?.classList.remove("touchHover");
        hovered.current = null;
    };

    const setTrigger = (element: HTMLElement | null) => {
        if (selectedTrigger.current === element) return;
        selectedTrigger.current?.classList.remove("headerGestureActive");
        selectedTrigger.current = element;
        selectedTrigger.current?.classList.add("headerGestureActive");
    };

    const reset = (close = false) => {
        if (state.current?.timer) clearTimeout(state.current.timer);
        state.current = null;
        clearHover();
        setTrigger(null);
        handlers.current.setDontHandle(false);
        handlers.current.setDontHandleOther(false);
        if (close) handlers.current.closeMenu();
    };

    const findTrigger = (x: number, y: number) => {
        // Only a finger physically over another header control may switch its menu.
        // The old nearest-button fallback treated motion toward the menu as a swipe to SM.
        const element = document.elementFromPoint(x, y);
        if (element?.closest(".ContextMenuWrapper")) return null;
        const trigger = element?.closest<HTMLElement>("[data-header-gesture]") ?? null;
        if (!trigger || !trigger.closest(".headerDiv")) return null;
        const box = trigger.getBoundingClientRect();
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) return null;
        return trigger;
    };

    const open = (trigger: HTMLElement) => {
        const press = state.current;
        if (!press || !trigger.isConnected) return;

        const kind = trigger.dataset.headerGesture as HeaderGesture | undefined;
        if (!kind) return;

        setTrigger(trigger);
        if (press.held && press.kind === kind) return;

        const { chatWith, openMenu } = handlers.current;
        const box = trigger.getBoundingClientRect();
        if (kind === "chat") {
            if (!chatWith) return;
            openMenu(Math.max(10, box.right - 240), box.bottom + 6, "acc", {
                id: chatWith.id,
                name: chatWith.name || chatWith.nick,
                nick: chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick,
            }, undefined, {
                note: chatWith.note,
                is_blocked: chatWith.is_blocked,
                pinned: chatWith.pinned,
                is_group: chatWith.is_group
            });
        } else if (kind === "habit") {
            openMenu(box.left, box.bottom + 6, "habitHeader", { id: trigger.dataset.habitId || "" });
        } else {
            openMenu(box.left, box.bottom + 6, "headerQuickAction", { id: "headerQuickAction" });
        }

        press.held = true;
        press.kind = kind;
        suppressUntil.current = performance.now() + 1000;
    };

    const touchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length !== 1) {
            if (state.current) reset(true);
            return;
        }
        const element = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-header-gesture]") : null;
        if (!element) return;

        reset();
        const touch = e.changedTouches[0];
        const press: PressState = {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            original: element,
            held: false,
            kind: null,
            timer: null
        };
        state.current = press;

        // Claim header gestures before SideMenu can start dragging.
        handlers.current.setDontHandle(true);
        handlers.current.setDontHandleOther(true);

        // Identical to SMnav: timer opens while the finger remains down, not on release.
        press.timer = setTimeout(() => {
            if (state.current !== press) return;
            open(press.original);
        }, 350);
        e.stopPropagation();
    };

    const touchMove = (e: TouchEvent<HTMLDivElement>) => {
        const press = state.current;
        if (!press) return;
        const touch = Array.from(e.touches).find(item => item.identifier === press.id);
        if (!touch) { reset(true); return; }

        press.x = touch.clientX;
        press.y = touch.clientY;
        e.stopPropagation();

        // Allow sliding across header buttons before and after the 350ms timer.
        // Do not cancel the timer on horizontal movement as the earlier handler did.
        if (!press.held) return;

        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const item = element?.closest<HTMLElement>(".ContextMenuWrapper .ContextMenuButt") ?? null;
        if (hovered.current !== item) {
            clearHover();
            hovered.current = item;
            hovered.current?.classList.add("touchHover");
        }

        if (!item && !element?.closest(".ContextMenuWrapper")) {
            const trigger = findTrigger(touch.clientX, touch.clientY);
            if (trigger && trigger !== selectedTrigger.current) open(trigger);
        }
        if (e.cancelable) e.preventDefault();
    };

    const touchEnd = (e: TouchEvent<HTMLDivElement>) => {
        const press = state.current;
        if (!press) return;
        const touch = Array.from(e.changedTouches).find(item => item.identifier === press.id);
        if (!touch) return;

        e.stopPropagation();
        if (!press.held) {
            // Let the browser dispatch the normal click for a short tap.
            reset();
            return;
        }

        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const item = element?.closest<HTMLElement>(".ContextMenuWrapper .ContextMenuButt") ?? null;
        suppressUntil.current = performance.now() + 1100;
        const onOriginal = element === press.original || !!(element && press.original.contains(element));
        reset(!item && !onOriginal);
        if (item) item.click();
        if (e.cancelable) e.preventDefault();
    };

    const touchCancel = (e: TouchEvent<HTMLDivElement>) => {
        if (!state.current) return;
        e.stopPropagation();
        reset(true);
    };

    useEffect(() => {
        const suppress = (event: MouseEvent) => {
            if (!event.isTrusted || performance.now() >= suppressUntil.current) return;
            const element = event.target instanceof Element ? event.target : null;
            if (event.type === "click" && !element?.closest(".headerDiv, .ContextMenuWrapper")) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        document.addEventListener("click", suppress, true);
        document.addEventListener("contextmenu", suppress, true);
        return () => {
            reset();
            document.removeEventListener("click", suppress, true);
            document.removeEventListener("contextmenu", suppress, true);
        };
    }, []);

    return { onTouchStart: touchStart, onTouchMove: touchMove, onTouchEnd: touchEnd, onTouchCancel: touchCancel };
}
