import { useEffect, useRef, type RefObject } from "react";

export default function useFormSwipe(ref: RefObject<HTMLDivElement | null>, active: "auth" | "reg", setActive: (value: "auth" | "reg") => void, body: string, disabled: boolean) {
    const activeRef = useRef(active);
    activeRef.current = active;
    useEffect(() => {
        const node = ref.current;
        if (!node || body !== "sign") return;
        let start: { x: number; y: number; left: number; time: number; axis: string } | null = null;
        let moved = false;
        const settle = (index: number, smooth = true) => {
            setActive(index ? "reg" : "auth");
            node.scrollTo({ left: index * node.clientWidth, behavior: smooth ? "smooth" : "instant" });
        };
        const down = (e: TouchEvent) => {
            if (disabled || e.touches.length !== 1 || (e.target as Element).closest("input, textarea, select")) return;
            moved = false;
            start = { x: e.touches[0].clientX, y: e.touches[0].clientY, left: node.scrollLeft, time: performance.now(), axis: "" };
        };
        const move = (e: TouchEvent) => {
            if (!start || e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - start.x;
            const dy = e.touches[0].clientY - start.y;
            if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10) start.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
            if (start.axis !== "x") return;
            e.preventDefault();
            moved = true;
            node.style.scrollSnapType = "none";
            node.scrollLeft = Math.max(0, Math.min(node.clientWidth, start.left - dx));
        };
        const finish = (e: TouchEvent) => {
            if (!start) return;
            node.style.scrollSnapType = "";
            if (start.axis === "x") {
                const dx = (e.changedTouches[0]?.clientX ?? start.x) - start.x;
                const fast = Math.abs(dx) > 25 && Math.abs(dx) / (performance.now() - start.time) > .35;
                settle(e.type === "touchcancel" ? (activeRef.current === "reg" ? 1 : 0) : fast ? (dx < 0 ? 1 : 0) : Math.round(node.scrollLeft / node.clientWidth));
            }
            start = null;
        };
        const click = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
        const scrollEnd = () => { if (!start) setActive(node.scrollLeft > node.clientWidth / 2 ? "reg" : "auth"); };
        const observer = new ResizeObserver(() => settle(activeRef.current === "reg" ? 1 : 0, false));
        observer.observe(node);
        node.addEventListener("touchstart", down, { passive: true });
        node.addEventListener("touchmove", move, { passive: false });
        node.addEventListener("touchend", finish);
        node.addEventListener("touchcancel", finish);
        node.addEventListener("click", click, true);
        node.addEventListener("scrollend", scrollEnd);
        return () => { observer.disconnect(); node.removeEventListener("touchstart", down); node.removeEventListener("touchmove", move); node.removeEventListener("touchend", finish); node.removeEventListener("touchcancel", finish); node.removeEventListener("click", click, true); node.removeEventListener("scrollend", scrollEnd); };
    }, [ref, body, disabled, setActive]);
}
