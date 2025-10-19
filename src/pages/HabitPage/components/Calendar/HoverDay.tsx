import { useEffect, useState } from "react";
import { useParams } from "react-router";

interface HoverDayProps {
    completed: number;
    missed: number;
    planned: number;
    targetRef: React.RefObject<HTMLDivElement | null>;
    comment?:string;
}

export default function HoverDay({ completed, missed, planned, targetRef, comment }: HoverDayProps) {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const { habitId: id } = useParams<{habitId:string}>()
    
    useEffect(() => {
        if (!targetRef.current) return;
        const rect = targetRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        const vw = window.innerWidth / 100
        setPosition({
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft + rect.width / 2 + 1.5*vw,
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
            {!id ? (
                <>
                    {completed > 0 && <div className="hoverRow"><div className="calendarDot comp" /> Выполнено: {completed}</div>}
                    {missed > 0 && <div className="hoverRow"><div className="calendarDot skip" /> Пропущено: {missed}</div>}
                    {planned > 0 && <div className="hoverRow"><div className="calendarDot will" /> Запланировано: {planned}</div>}
                    {completed === 0 && missed === 0 && planned === 0 && (
                        <div className="hoverRow hrEmpty">В этот день нет привычек</div>
                    )}
                </>
            ) : (
                <div className={`hoverRow ${!comment ? "hrEmpty" : " "}`}>{comment || "Нет комментария"}</div>
            )}
        </div>
    );
}
