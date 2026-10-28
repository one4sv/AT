import { useLayoutEffect, useRef, type TextareaHTMLAttributes, type RefObject } from "react";

interface TAProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    taRef?: RefObject<HTMLTextAreaElement | null>;
    onSend?: () => void;
    onFiles?: (files: File[]) => void;
    minHeight?: number;
    maxHeight?: number;
}

export default function TA({
    taRef,
    onSend,
    onFiles,
    minHeight = 5,
    maxHeight = 50,
    onKeyDown,
    onPaste,
    ...props
}: TAProps) {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const ref = taRef || localRef;

    useLayoutEffect(() => {
        const ta = ref.current;
        if (!ta) return;
        const resize = () => {
            if (!ta.clientWidth) return;
            ta.style.height = "0";
            const vh = document.documentElement.clientHeight / 100;
            const style = getComputedStyle(ta);
            const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
            const height = Math.max(minHeight, (ta.scrollHeight + border) / vh);
            ta.style.height = Math.min(height, maxHeight) + "vh";
            ta.style.overflowY = height > maxHeight ? "auto" : "hidden";
        };
        resize();
        let width = ta.clientWidth;
        const observer = new ResizeObserver(() => {
            if (ta.clientWidth === width) return;
            width = ta.clientWidth;
            resize();
        });
        observer.observe(ta);
        window.addEventListener("resize", resize);
        window.visualViewport?.addEventListener("resize", resize);
        let active = true;
        document.fonts.ready.then(() => {
            if (active) resize();
        });
        return () => {
            active = false;
            observer.disconnect();
            window.removeEventListener("resize", resize);
            window.visualViewport?.removeEventListener("resize", resize);
        };
    }, [props.value, minHeight, maxHeight, ref]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !onSend || event.nativeEvent.isComposing) return;

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        onPaste?.(event);
        if (event.defaultPrevented || !onFiles) return;

        const files = Array.from(event.clipboardData.files);
        if (!files.length) return;

        if (!event.clipboardData.getData("text/plain")) event.preventDefault();
        onFiles(files);
    };

    return (
        <textarea
            {...props}
            ref={ref}
            rows={1}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
        />
    );
}
