import { useEffect, useRef } from "react";
import { useChat } from "../ChatHook";
import { useContextMenu } from "../ContextMenuHook";

type PressState = {
    id: number;
    x: number;
    y: number;
    active: boolean;
    point: string;
    timer: ReturnType<typeof setTimeout> | null;
};

export default function useHeaderMenuGestures() {
    const { chatWith } = useChat();
    const { openMenu, closeMenu } = useContextMenu();
    const activeHandlers = useRef({ chatWith, openMenu, closeMenu });
    activeHandlers.current = { chatWith, openMenu, closeMenu };

    useEffect(() => {
        let press: PressState | null = null;
        let hovered: HTMLElement | null = null;
        let suppressClickUntil = 0;

        const clearHover = () => {
            hovered?.classList.remove("touchHover");
            hovered = null;
        };

        const cancelTimer = () => {
            if (press?.timer) clearTimeout(press.timer);
            if (press) press.timer = null;
        };

        const open = (element: HTMLElement) => {
            if (!press) return;
            const kind = element.dataset.headerGesture;
            if (!kind || (press.active && press.point === kind)) return;

            const { openMenu, chatWith } = activeHandlers.current;
            const rect = element.getBoundingClientRect();
            const x = kind === "chat" ? Math.max(10, rect.right - 240) : rect.left;
            const y = rect.bottom + 6;

            if (kind === "chat") {
                if (!chatWith) return;
                openMenu(x, y, "acc", {
                    id: chatWith.id,
                    name: chatWith.name || chatWith.nick,
                    nick: chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick,
                }, undefined, {
                    note: chatWith.note,
                    is_blocked: chatWith.is_blocked,
                    pinned: chatWith.pinned,
                    is_group: chatWith.is_group,
                });
            } else {
                openMenu(x, y, "headerQuickAction", { id: "headerQuickAction" });
            }
            press.point = kind;
            press.active = true;
        };

        const start = (event: PointerEvent) => {
            if (!event.isPrimary || press) return;
            if (event.pointerType !== "touch" && event.pointerType !== "pen" && event.pointerType !== "mouse") return;
            const el = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-header-gesture]") : null;
            if (!el) return;
            press = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                active: false,
                point: "",
                timer: null,
            };
            const thisPress = press;
            thisPress.timer = setTimeout(() => {
                if (press !== thisPress || !el.isConnected) return;
                open(el);
                suppressClickUntil = performance.now() + 1000;
            }, 350);
        };

        const move = (event: PointerEvent) => {
            if (!press || press.id !== event.pointerId) return;

            if (!press.active) {
                if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) {
                    cancelTimer();
                    press = null;
                }
                return;
            }

            const element = document.elementFromPoint(event.clientX, event.clientY);
            const trigger = element?.closest<HTMLElement>("[data-header-gesture]");
            if (trigger) open(trigger);

            const item = element?.closest<HTMLElement>(".ContextMenuButt") ?? null;
            if (hovered !== item) {
                clearHover();
                hovered = item;
                hovered?.classList.add("touchHover");
            }
        };

        const end = (event: PointerEvent) => {
            if (!press || press.id !== event.pointerId) return;
            const wasActive = press.active;
            cancelTimer();
            press = null;

            if (!wasActive) {
                clearHover();
                return;
            }

            suppressClickUntil = performance.now() + 1000;
            const point = document.elementFromPoint(event.clientX, event.clientY);
            const item = point?.closest<HTMLElement>(".ContextMenuButt") ?? null;
            clearHover();
            if (event.type === "pointercancel" || !item) {
                activeHandlers.current.closeMenu();
                return;
            }

            item.click();
        };

        const suppress = (event: MouseEvent) => {
            if (!event.isTrusted || performance.now() > suppressClickUntil) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        document.addEventListener("pointerdown", start, true);
        document.addEventListener("pointermove", move, true);
        document.addEventListener("pointerup", end, true);
        document.addEventListener("pointercancel", end, true);
        document.addEventListener("click", suppress, true);

        return () => {
            cancelTimer();
            clearHover();
            document.removeEventListener("pointerdown", start, true);
            document.removeEventListener("pointermove", move, true);
            document.removeEventListener("pointerup", end, true);
            document.removeEventListener("pointercancel", end, true);
            document.removeEventListener("click", suppress, true);
        };
    }, []);
}
