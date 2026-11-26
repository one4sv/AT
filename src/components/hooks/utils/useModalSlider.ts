import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useSideMenu } from "../SideMenuHook";
import { useContextMenu } from "../ContextMenuHook";

export default function useModalSlider(activeIndex: number, count: number, filterKey: string, onSelect: (index: number) => void) {
    const { setDontHandle, dontHandleOther } = useSideMenu();
    const { menu } = useContextMenu();
    const viewportRef = useRef<HTMLDivElement>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const blocked = useRef(false);
    const selectRef = useRef(onSelect);
    const suppressUntil = useRef(0);
    blocked.current = dontHandleOther || menu.visible;
    selectRef.current = onSelect;

    useLayoutEffect(() => {
        setPreviewIndex(null);
    }, [activeIndex, filterKey]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || count < 2) return;
        let press: { x: number; y: number; id: number; width: number; owned: boolean } | null = null;
        const release = () => {
            if (press?.owned) setDontHandle(false);
            press = null;
            setPreviewIndex(null);
        };
        const start = (event: TouchEvent) => {
            release();
            suppressUntil.current = 0;
            if (event.touches.length !== 1 || blocked.current || !(event.target instanceof Element) ||
                event.target.closest("button, input, textarea, select, [contenteditable=true]")) return;
            const touch = event.touches[0];
            press = {x: touch.clientX, y: touch.clientY, id: touch.identifier, width: Math.max(1, viewport.clientWidth), owned: false};
        };
        const move = (event: TouchEvent) => {
            if (!press) return;
            if (event.touches.length !== 1 || blocked.current || event.defaultPrevented) { release(); return; }
            const touch = event.touches[0];
            if (touch.identifier !== press.id) { release(); return; }
            const dx = touch.clientX - press.x;
            const dy = touch.clientY - press.y;
            if (!press.owned) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
                if (Math.abs(dx) <= Math.abs(dy)) { release(); return; }
                press.owned = true;
                suppressUntil.current = performance.now() + 450;
                setDontHandle(true);
            }
            if (event.cancelable) event.preventDefault();
            suppressUntil.current = performance.now() + 450;
            setPreviewIndex(Math.max(Math.max(0, activeIndex - 1), Math.min(Math.min(count - 1, activeIndex + 1), activeIndex - dx / press.width)));
        };
        const end = (event: TouchEvent) => {
            if (!press) return;
            const touch = Array.from(event.changedTouches).find(item => item.identifier === press?.id);
            if (!touch && event.touches.length) return;
            if (press.owned) {
                suppressUntil.current = performance.now() + 450;
                if (event.cancelable) event.preventDefault();
                if (touch && !blocked.current) {
                    const dx = touch.clientX - press.x;
                    if (Math.abs(dx) >= Math.min(press.width * .25, 85)) {
                        selectRef.current(Math.max(0, Math.min(count - 1, activeIndex + (dx < 0 ? 1 : -1))));
                    }
                }
            }
            release();
        };
        const cancel = () => {
            if (!press) return;
            if (press.owned) suppressUntil.current = performance.now() + 450;
            release();
        };
        const extraTouch = (event: TouchEvent) => {
            if (press && event.touches.length > 1) cancel();
        };
        viewport.addEventListener("touchstart", start, {passive: true});
        viewport.addEventListener("touchmove", move, {passive: false});
        window.addEventListener("touchstart", extraTouch, {capture: true, passive: true});
        window.addEventListener("touchend", end, {capture: true, passive: false});
        window.addEventListener("touchcancel", cancel, true);
        window.addEventListener("blur", cancel);
        return () => {
            viewport.removeEventListener("touchstart", start);
            viewport.removeEventListener("touchmove", move);
            window.removeEventListener("touchstart", extraTouch, true);
            window.removeEventListener("touchend", end, true);
            window.removeEventListener("touchcancel", cancel, true);
            window.removeEventListener("blur", cancel);
            if (press?.owned) setDontHandle(false);
        };
    }, [activeIndex, count, filterKey, setDontHandle]);

    const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
        if (performance.now() > suppressUntil.current) return;
        suppressUntil.current = 0;
        event.preventDefault();
        event.stopPropagation();
    };
    return {viewportRef, previewIndex, setPreviewIndex, position: previewIndex ?? activeIndex, onClickCapture};
}
