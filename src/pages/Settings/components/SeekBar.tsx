import { useRef, useState } from "react";

export interface SeekBarInterface {
    min: number;
    max: number;
    value: number;
    unit?: string;
    step?: number;
    onChange?: (value: number) => void;
}

export default function SeekBar({
    min,
    max,
    value,
    unit,
    step = 1,
    onChange,
}: SeekBarInterface) {
    const lineRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const [hoverPercent, setHoverPercent] = useState(0);

    const percent = ((value - min) / (max - min)) * 100;

    const updateValue = (clientX: number) => {
        const data = getValue(clientX);
        if (!data) return;

        onChange?.(data.value);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        updateValue(e.clientX);

        const move = (e: MouseEvent) => updateValue(e.clientX);

        const up = () => {
            setDragging(false);
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    };

    const getValue = (clientX: number) => {
        if (!lineRef.current) return null;

        const rect = lineRef.current.getBoundingClientRect();

        let p = (clientX - rect.left) / rect.width;
        p = Math.max(0, Math.min(1, p));

        let newValue = min + p * (max - min);
        newValue = Math.round(newValue / step) * step;
        newValue = Math.max(min, Math.min(max, newValue));

        return {
            value: newValue,
            percent: p * 100,
        };
    };
    

    return (
        <div className="seekBarWrapper">
            <div
                className="seekBarLine"
                ref={lineRef}
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                    const data = getValue(e.clientX);
                    if (!data) return;

                    setHoverValue(data.value);
                    setHoverPercent(data.percent);
                }}

                onMouseLeave={() => setHoverValue(null)}
            >

                {hoverValue !== null && (
                    <div
                        className="seekBarHoverValue"
                        style={{ left: `${hoverPercent}%` }}
                    >
                        {hoverValue}
                        {unit}
                    </div>
                )}
                <div
                    className="seekBarFill"
                    style={{ width: `${percent}%` }}
                />

                <div
                    className={`seekBarDot ${dragging ? "dragging" : ""}`}
                    style={{ left: `${percent}%` }}
                />

                <div
                    className="seekBarCurrent"
                    style={{ left: `${percent}%` }}
                >
                    {(value === min || value === max) ? "" : value}
                    {(value === min || value === max) ? "" : unit}
                </div>
            </div>

            <div className="seekBarBottom">
                <span className={value === min ? "currentValue" : ""}>
                    {min}
                    {unit}
                </span>

                <span className={value === max ? "currentValue" : ""}>
                    {max}
                    {unit}
                </span>
            </div>
        </div>
    );
}