import type { ReactNode } from "react";
import "../../scss/entitySuggestionList.scss";

export interface EntitySuggestionItem {
    id: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    suffix?: ReactNode;
}

export default function EntitySuggestionList({
    items,
    activeIndex,
    onSelect,
    onPreview,
    onPreviewEnd,
    className = ""
}: {
    items: EntitySuggestionItem[];
    activeIndex: number;
    onSelect: (item: EntitySuggestionItem) => void;
    onPreview?: (item: EntitySuggestionItem) => void;
    onPreviewEnd?: () => void;
    className?: string;
}) {
    if (!items.length) return null;
    return (
        <div className={`entitySuggestionList ${className}`} role="listbox">
            {items.map((item, index) => (
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
            ))}
        </div>
    );
}
