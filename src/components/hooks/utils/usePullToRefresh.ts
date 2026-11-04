import { useEffect } from "react";
import { requestContentRefresh, type ContentRefreshScope } from "../../ts/utils/contentRefresh";

type PullStart = {
    isSideMenu: boolean;
    slideIndex: number;
    x: number;
    y: number;
    scrollElement: HTMLElement | null;
    ready: boolean;
};

export default function usePullToRefresh(pathname: string) {
    useEffect(() => {
        if (pathname.startsWith("/chat") ||
            pathname.startsWith("/habit/") ||
            pathname === "/post/new" ||
            pathname.endsWith("/edit")) return;

        let start: PullStart | null = null;

        const findScroll = (target: HTMLElement, root: Element): HTMLElement | null => {
            let node: HTMLElement | null = target;

            while (node && root.contains(node)) {
                const style = window.getComputedStyle(node);
                if ((style.overflowY === "auto" || style.overflowY === "scroll") &&
                    node.scrollHeight > node.clientHeight + 2) return node;

                node = node.parentElement;
            }

            return null;
        };

        const touchStart = (event: TouchEvent) => {
            start = null;
            if (event.touches.length !== 1) return;

            const element = event.target;
            if (!(element instanceof Element) ||
                element.closest("input, textarea, select, [contenteditable='true'], .ContextMenuWrapper, .headerDiv, .smHeader")) return;

            const root = element.closest(".sideMenu, .page-content");
            if (!root) return;
            const target = element instanceof HTMLElement ? element : element.parentElement;
            if (!target) return;

            // Acc owns its own pull gesture: it must not conflict with the info collapse.
            if (pathname.startsWith("/acc") && root.classList.contains("page-content")) return;

            const scroller = findScroll(target, root);
            if (scroller ? scroller.scrollTop > 2 : window.scrollY > 2) return;

            const sideSlide = target.closest(".sideMenu .slider > .slide");
            const slides = sideSlide ? Array.from(sideSlide.parentElement?.children ?? []) : [];
            start = {
                isSideMenu: root.classList.contains("sideMenu"),
                slideIndex: sideSlide ? slides.indexOf(sideSlide) : -1,
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
                scrollElement: scroller,
                ready: false
            };
        };

        const touchMove = (event: TouchEvent) => {
            if (!start || event.touches.length !== 1) {
                start = null;
                return;
            }

            const deltaX = event.touches[0].clientX - start.x;
            const deltaY = event.touches[0].clientY - start.y;

            if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
                start = null;
                return;
            }

            if (start.scrollElement && start.scrollElement.scrollTop > 2) {
                start = null;
                return;
            }

            start.ready = deltaY >= 95 && deltaY > Math.abs(deltaX) * 1.6;
        };

        const touchEnd = (event: TouchEvent) => {
            if (!start) return;
            const current = start;
            start = null;

            const touch = event.changedTouches[0];
            if (!touch) return;

            const deltaY = touch.clientY - current.y;
            const deltaX = touch.clientX - current.x;

            if (current.ready && deltaY >= 95 && deltaY > Math.abs(deltaX) * 1.6 &&
                (!current.scrollElement || current.scrollElement.scrollTop <= 2)) {
                if (current.isSideMenu) {
                    const scopes: ContentRefreshScope[] = ["chats", "habits", "spots", "user"];
                    const scope = scopes[current.slideIndex];
                    if (scope) requestContentRefresh(scope, pathname);
                } else {
                    requestContentRefresh("page", pathname);
                }
            }
        };

        const cancel = () => {
            start = null;
        };

        document.addEventListener("touchstart", touchStart, { passive: true, capture: true });
        document.addEventListener("touchmove", touchMove, { passive: true, capture: true });
        document.addEventListener("touchend", touchEnd, { passive: true, capture: true });
        document.addEventListener("touchcancel", cancel, true);

        return () => {
            document.removeEventListener("touchstart", touchStart, true);
            document.removeEventListener("touchmove", touchMove, true);
            document.removeEventListener("touchend", touchEnd, true);
            document.removeEventListener("touchcancel", cancel, true);
        };
    }, [pathname]);
}
