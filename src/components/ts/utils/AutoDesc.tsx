import { useEffect, useRef } from "react";

export default function AutoDesc({ desc, readOnly, className }: { desc: string | null, readOnly?: boolean, className:string }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const adjustHeight = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";  // сброс высоты
        el.style.height = el.scrollHeight + "px"; // установка под контент
    };

    useEffect(() => {
        adjustHeight();
    }, [desc]);

    return (
        <textarea
            ref={textareaRef}
            readOnly={readOnly ?? false}
            className={className}
            value={desc || ""}
            onInput={adjustHeight}
        />
    );
}
