import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import "../../scss/entitySuggestionList.scss";
import "../../scss/Loading.scss";

export interface EntitySuggestionItem {
    id: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    suffix?: ReactNode;
}

export default function EntitySuggestionList({
    items,
    loading = false,
    loadingLabel,
    control,
    activeIndex,
    onSelect,
    onPreview,
    onPreviewEnd,
    className = "",
    anchorRef,
    topAnchorRef,
    popupRef
}: {
    items: EntitySuggestionItem[];
    loading?: boolean;
    loadingLabel?: string;
    control?: ReactNode;
    activeIndex: number;
    onSelect: (item: EntitySuggestionItem) => void;
    onPreview?: (item: EntitySuggestionItem) => void;
    onPreviewEnd?: () => void;
    className?: string;
    anchorRef?: RefObject<HTMLElement | null>;
    topAnchorRef?: RefObject<HTMLElement | null>;
    popupRef?: RefObject<HTMLDivElement | null>;
}) {
    const [placement, setPlacement] = useState<{top: number; left: number; width: number; availableHeight: number} | null>(null);

    useLayoutEffect(() => {
        const anchor = anchorRef?.current;
        if (!anchor) return;
        const topAnchor = topAnchorRef?.current;
        let frame = 0;
        let followUntil = 0;
        let last: {top:number; left:number; width:number; availableHeight:number} | null = null;
        const update = () => {
            const rect = anchor.getBoundingClientRect();
            const top = Math.min(rect.top, topAnchor?.getBoundingClientRect().top ?? rect.top);
            const width = Math.min(rect.width, Math.max(0, window.innerWidth - 16));
            const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
            const viewportTop = window.visualViewport?.offsetTop ?? 0;
            const availableHeight = Math.max(0, Math.floor(top - viewportTop - 16));
            if (last?.top !== top || last.left !== left || last.width !== width || last.availableHeight !== availableHeight) {
                last = { top, left, width, availableHeight };
                setPlacement(last);
            }
        };
        // The expanded composer animates its bottom position as well as its size.
        // ResizeObserver alone cannot track a pure position transition.
        const follow = (now: number) => {
            frame = 0;
            update();
            if (now < followUntil) frame = requestAnimationFrame(follow);
        };
        const refresh = () => {
            update();
            if (topAnchor) {
                followUntil = performance.now() + 400;
                if (!frame) frame = requestAnimationFrame(follow);
            }
        };
        const observer = new ResizeObserver(refresh);
        observer.observe(anchor);
        if (topAnchor && topAnchor !== anchor) observer.observe(topAnchor);
        refresh();
        topAnchor?.addEventListener("transitionrun", refresh);
        topAnchor?.addEventListener("transitionend", refresh);
        topAnchor?.addEventListener("transitioncancel", refresh);
        window.addEventListener("resize", refresh);
        window.addEventListener("scroll", refresh, true);
        window.visualViewport?.addEventListener("resize", refresh);
        window.visualViewport?.addEventListener("scroll", refresh);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
            topAnchor?.removeEventListener("transitionrun", refresh);
            topAnchor?.removeEventListener("transitionend", refresh);
            topAnchor?.removeEventListener("transitioncancel", refresh);
            window.removeEventListener("resize", refresh);
            window.removeEventListener("scroll", refresh, true);
            window.visualViewport?.removeEventListener("resize", refresh);
            window.visualViewport?.removeEventListener("scroll", refresh);
        };
    }, [anchorRef, topAnchorRef]);

    const listRef = useRef<HTMLDivElement | null>(null);
    const activeId = items[activeIndex]?.id;
    useLayoutEffect(() => {
        const container = listRef.current;
        const active = container?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!container || !active) return;
        const viewport = container.getBoundingClientRect();
        const row = active.getBoundingClientRect();
        const top = viewport.top + container.clientTop;
        const bottom = top + container.clientHeight;
        // Scroll only the suggestions, never the underlying chat or page.
        if (row.top < top) container.scrollTop += row.top - top;
        else if (row.bottom > bottom) container.scrollTop += row.bottom - bottom;
    }, [activeIndex, activeId, placement]);

    if (!items.length && !loading && !control) return null;
    const list = (
        <div ref={node => {
            listRef.current = node;
            if (popupRef) popupRef.current = node;
        }} className={`entitySuggestionList ${className} ${anchorRef ? "entitySuggestionPortal" : ""}`}
            role={control ? "group" : "listbox"} aria-busy={loading || undefined} aria-label={loading ? loadingLabel : undefined} style={anchorRef ? {
                top: placement?.top || 0,
                left: placement?.left || 0,
                width: placement?.width || 0,
                "--entity-suggestion-available-height": (placement?.availableHeight ?? 0) + "px",
                visibility: placement && placement.availableHeight >= 24 ? "visible" : "hidden"
            } as CSSProperties : undefined}>
            {control ?? (loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="entitySuggestionItem entitySuggestionSkeleton" aria-hidden="true">
                <span className="entitySuggestionContent">
                    <span className="skeletonLine"/>
                    <span className="skeletonLine skeletonShort"/>
                </span>
            </div>) : items.map((item, index) => (
                <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    className={`entitySuggestionItem ${activeIndex === index ? "active" : ""}`}
                    onPointerDown={event => {
                        if (event.pointerType === "mouse") event.preventDefault();
                    }}
                    onMouseEnter={() => onPreview?.(item)}
                    onMouseLeave={onPreviewEnd}
                    onClick={() => onSelect(item)}
                >
                    {item.icon && <span className="entitySuggestionIcon">{item.icon}</span>}
                    <span className="entitySuggestionContent">
                        <span className="entitySuggestionTitle">{item.label}</span>
                        {item.description && <span className="entitySuggestionDescription">{item.description}</span>}
                    </span>
                    {item.suffix && <span className="entitySuggestionSuffix">{item.suffix}</span>}
                </button>
            )))}
        </div>
    );
    return anchorRef ? createPortal(list, document.body) : list;
}
