import { useEffect, useRef, useState } from "react";

export default function AutoFitIconText({ text }: { text?: string }) {
    const textRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState(16);

    useEffect(() => {
        const element = textRef.current;
        if (!element) return;

        const resizeText = () => {
            element.style.fontSize = "16px";

            const availableWidth = element.clientWidth;
            if (!availableWidth) return;

            let size = 16;
            while (element.scrollWidth > availableWidth && size > 6) {
                size -= 0.5;
                element.style.fontSize = `${size}px`;
            }

            setFontSize(size);
        };

        const observer = new ResizeObserver(resizeText);
        observer.observe(element);
        resizeText();

        return () => observer.disconnect();
    }, [text]);

    return (
        <span
            ref={textRef}
            className="settingSearchSpanIcon"
            style={{ fontSize: `${fontSize}px` }}
        >
            {text}
        </span>
    );
}