import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
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
    popupRef?: RefObject<HTMLDivElement | null>;
}) {
    const [placement, setPlacement] = useState<{top: number; left: number; width: number} | null>(null);

    useLayoutEffect(() => {
        const anchor = anchorRef?.current;
        if (!anchor) return;
        const update = () => {
            const rect = anchor.getBoundingClientRect();
            const width = Math.min(rect.width, Math.max(0, window.innerWidth - 16));
            const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
            setPlacement(previous => previous?.top === rect.top && previous.left === left &&
                previous.width === width ? previous : { top: rect.top, left, width });
        };
        const observer = new ResizeObserver(update);
        observer.observe(anchor);
        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        window.visualViewport?.addEventListener("resize", update);
        window.visualViewport?.addEventListener("scroll", update);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
            window.visualViewport?.removeEventListener("resize", update);
            window.visualViewport?.removeEventListener("scroll", update);
        };
    }, [anchorRef]);

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
                visibility: placement ? "visible" : "hidden"
            } : undefined}>
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
