import { useEffect } from "react";

export default function useLongPressContextMenu() {
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let start: { x: number; y: number; id: number; target: HTMLElement } | null = null;
        let suppressUntil = 0;
        const cancel = () => {
            clearTimeout(timer);
            timer = undefined;
            start = null;
        };
        const down = (event: PointerEvent) => {
            if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
            if (!event.isPrimary) { cancel(); return; }
            suppressUntil = 0;
            const target = event.target as HTMLElement;
            const element = target.closest<HTMLElement>("[data-context-menu]");
            if (!element || target.closest("button, input, textarea, select, [contenteditable=true]")) return;
            cancel();
            start = { x: event.clientX, y: event.clientY, id: event.pointerId, target: element };
            timer = setTimeout(() => {
                if (!start || !start.target.isConnected) return;
                const { x, y, target } = start;
                suppressUntil = performance.now() + 1000;
                target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
            }, 350);
        };
        const move = (event: PointerEvent) => {
            if (!start || event.pointerId !== start.id) return;
            if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancel();
        };
        const click = (event: MouseEvent) => {
            if (performance.now() >= suppressUntil) return;
            event.preventDefault();
            event.stopPropagation();
            suppressUntil = 0;
        };
        const nativeContext = (event: MouseEvent) => {
            if (!event.isTrusted || performance.now() >= suppressUntil) return;
            event.preventDefault();
            event.stopPropagation();
        };
        document.addEventListener("pointerdown", down, true);
        document.addEventListener("pointermove", move, { passive: true, capture: true });
        document.addEventListener("pointerup", cancel, true);
        document.addEventListener("pointercancel", cancel, true);
        document.addEventListener("click", click, true);
        document.addEventListener("contextmenu", nativeContext, true);
        return () => {
            cancel();
            document.removeEventListener("pointerdown", down, true);
            document.removeEventListener("pointermove", move, true);
            document.removeEventListener("pointerup", cancel, true);
            document.removeEventListener("pointercancel", cancel, true);
            document.removeEventListener("click", click, true);
            document.removeEventListener("contextmenu", nativeContext, true);
        };
    }, []);
}
