import { useCallback, useEffect, useRef, useState } from "react";

export default function useLandingSheet() {
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [drag, setDrag] = useState(0);
    const openRef = useRef(open);
    openRef.current = open;

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        let wheelTotal = 0;
        let wheelLocked = false;
        let wheelTimer: ReturnType<typeof setTimeout>;
        let gesture: { x: number; y: number; time: number; target: HTMLElement; direction: string } | null = null;
        let distance = 0;
        let mouseGesture: { y: number; target: HTMLElement; pointerId: number } | null = null;
        let suppressClick = false;
        let clickTimer: ReturnType<typeof setTimeout>;

        const canScroll = (target: HTMLElement, delta: number) => {
            for (let element: HTMLElement | null = target; element && element !== root; element = element.parentElement) {
                if (!/(auto|scroll)/.test(getComputedStyle(element).overflowY)) continue;
                if (delta > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 2) return true;
                if (delta < 0 && element.scrollTop > 2) return true;
            }
            return false;
        };
        const blocked = () => !!document.activeElement?.matches("input, textarea, select, [contenteditable=true]") || !!document.querySelector(".blackout");
        const wheel = (event: WheelEvent) => {
            if (event.ctrlKey || blocked() || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
            if (canScroll(event.target as HTMLElement, event.deltaY)) return;
            event.preventDefault();
            clearTimeout(wheelTimer);
            wheelTimer = setTimeout(() => { wheelLocked = false; wheelTotal = 0; }, 220);
            if (wheelLocked) return;
            const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1);
            if (Math.sign(delta) !== Math.sign(wheelTotal)) wheelTotal = 0;
            wheelTotal += delta;
            if (Math.abs(wheelTotal) < 40) return;
            setOpen(wheelTotal > 0);
            wheelLocked = true;
        };
        const start = (event: TouchEvent) => {
            if (event.touches.length !== 1 || blocked()) return;
            const target = event.target as HTMLElement;
            if (target.closest("input, textarea, select, a, [contenteditable=true]")) return;
            const touch = event.touches[0];
            gesture = { x: touch.clientX, y: touch.clientY, time: performance.now(), target, direction: "" };
            distance = 0;
        };
        const move = (event: TouchEvent) => {
            if (!gesture || event.touches.length !== 1) return;
            const touch = event.touches[0];
            const dx = touch.clientX - gesture.x;
            const dy = touch.clientY - gesture.y;
            if (!gesture.direction && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
                gesture.direction = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
                if (gesture.direction === "vertical" && canScroll(gesture.target, -dy)) gesture.direction = "scroll";
            }
            if (gesture.direction !== "vertical") return;
            event.preventDefault();
            distance = openRef.current ? Math.max(0, dy) : Math.min(0, dy);
            setDrag(distance);
        };
        const finish = () => {
            if (gesture?.direction === "vertical") {
                const speed = Math.abs(distance) / Math.max(1, performance.now() - gesture.time);
                if (Math.abs(distance) > 65 || (Math.abs(distance) > 24 && speed > .45)) setOpen(distance < 0);
            }
            gesture = null;
            distance = 0;
            setDrag(0);
        };
        const cancel = () => { gesture = null; distance = 0; setDrag(0); };
        const pointerStart = (event: PointerEvent) => {
            if (event.pointerType !== "mouse" || event.button !== 0 || blocked()) return;
            const target = (event.target as HTMLElement).closest<HTMLElement>(".landingFooterHandle, .landingFooterTrigger");
            if (!target) return;
            mouseGesture = { y: event.clientY, target, pointerId: event.pointerId };
            distance = 0;
            target.setPointerCapture(event.pointerId);
        };
        const pointerMove = (event: PointerEvent) => {
            if (!mouseGesture) return;
            const dy = event.clientY - mouseGesture.y;
            distance = openRef.current ? Math.max(0, dy) : Math.min(0, dy);
            setDrag(distance);
        };
        const pointerFinish = (event: PointerEvent) => {
            if (!mouseGesture) return;
            suppressClick = Math.abs(distance) > 8;
            if (event.type !== "pointercancel" && Math.abs(distance) > 65) setOpen(distance < 0);
            const { target, pointerId } = mouseGesture;
            mouseGesture = null;
            if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
            distance = 0;
            setDrag(0);
            clickTimer = setTimeout(() => { suppressClick = false; }, 0);
        };
        const click = (event: MouseEvent) => {
            if (!suppressClick) return;
            event.preventDefault();
            event.stopPropagation();
        };
        const key = (event: KeyboardEvent) => {
            if (blocked()) return;
            if (event.key === "Escape") { setOpen(false); return; }
            if (event.key === "Tab" && openRef.current) {
                const controls = Array.from(root.querySelectorAll<HTMLElement>(".landingFooterSheet button, .landingFooterSheet a, .landingFooterSheet input, .landingFooterSheet [tabindex='0']")).filter(element => element.getClientRects().length && !element.matches(":disabled"));
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && (document.activeElement === first || document.activeElement === root.querySelector(".landingFooterSheet"))) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                return;
            }
            if ((event.target as HTMLElement).closest("button, a")) return;
            if (event.key === "PageDown" || event.key === "PageUp") {
                event.preventDefault();
                setOpen(event.key === "PageDown");
            }
        };
        root.addEventListener("wheel", wheel, { passive: false });
        root.addEventListener("touchstart", start, { passive: true });
        root.addEventListener("touchmove", move, { passive: false });
        root.addEventListener("touchend", finish);
        root.addEventListener("touchcancel", cancel);
        root.addEventListener("keydown", key);
        root.addEventListener("pointerdown", pointerStart);
        root.addEventListener("pointermove", pointerMove);
        root.addEventListener("pointerup", pointerFinish);
        root.addEventListener("pointercancel", pointerFinish);
        root.addEventListener("click", click, true);
        return () => {
            clearTimeout(wheelTimer);
            clearTimeout(clickTimer);
            root.removeEventListener("wheel", wheel);
            root.removeEventListener("touchstart", start);
            root.removeEventListener("touchmove", move);
            root.removeEventListener("touchend", finish);
            root.removeEventListener("touchcancel", cancel);
            root.removeEventListener("keydown", key);
            root.removeEventListener("pointerdown", pointerStart);
            root.removeEventListener("pointermove", pointerMove);
            root.removeEventListener("pointerup", pointerFinish);
            root.removeEventListener("pointercancel", pointerFinish);
            root.removeEventListener("click", click, true);
        };
    }, []);

    return { rootRef, open, setOpen, drag, close };
}
