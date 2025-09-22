import { useEffect, useState } from "react";

interface HoverDayProps {
    completed: number;
    missed: number;
    planned: number;
    targetRef: React.RefObject<HTMLDivElement | null>;
}

export default function HoverDay({ completed, missed, planned, targetRef }: HoverDayProps) {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!targetRef.current) return;
        const rect = targetRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        const vh = window.innerHeight / 100
        const vw = window.innerWidth / 100
        setPosition({
            top: rect.top + scrollTop - 1*vh,
            left: rect.left + scrollLeft + rect.width / 2 + 6*vw,
        });
    }, [targetRef]);

    return (
        <div
            className="hoverDayDiv"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <div className="hoverRow"><div className="calendarDot comp" /> Выполнено: {completed}</div>
            <div className="hoverRow"><div className="calendarDot skip" /> Пропущено: {missed}</div>
            <div className="hoverRow"><div className="calendarDot will" /> Запланировано: {planned}</div>
        </div>
    );
}
