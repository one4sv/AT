import { useEffect, useRef, type ChangeEvent } from "react";

interface AutoDescProps {
    value?: string;                  // контролируемое значение (рекомендуется)
    defaultValue?: string;           // fallback для неконтролируемого режима
    readOnly?: boolean;
    className?: string;
    onChange?: (newValue: string) => void;   // ← новый опциональный колбэк
}

export default function AutoDesc({
    value,
    defaultValue = "",
    readOnly = false,
    className = "",
    onChange,
}: AutoDescProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight();
        onChange?.(e.target.value);
    };

    const displayValue = value !== undefined ? value : defaultValue;

    return (
        <textarea
            ref={textareaRef}
            value={displayValue}           // контролируемое значение
            readOnly={readOnly}
            className={className}
            onInput={adjustHeight}         // на всякий случай (для быстрого ввода)
            onChange={handleChange}
        />
    );
}