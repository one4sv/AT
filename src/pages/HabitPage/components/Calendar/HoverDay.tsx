import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router";

interface HoverDayProps {
    completed: number;
    missed: number;
    planned: number;
    ongoing: number;
    targetRef: React.RefObject<HTMLDivElement | null>;
    comment?: string;
}

export default function HoverDay({
    ongoing,
    completed,
    missed,
    planned,
    targetRef,
    comment,
}: HoverDayProps) {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const { habitId: id } = useParams<{ habitId: string }>();

    useEffect(() => {
        const updatePosition = () => {
            if (!targetRef.current) return;

            const rect = targetRef.current.getBoundingClientRect();
            const vw = window.innerWidth / 100;

            setPosition({
                top: rect.top,
                left: rect.left + rect.width / 2 + 1.5 * vw,
            });
        };

        updatePosition();

        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [targetRef]);

    const content = (
        <div
            className="hoverDayDiv"
            style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                zIndex: 9, // повыше
            }}
        >
            {!id ? (
                <>
                    {ongoing > 0 && (
                        <div className="hoverRow">
                            <div className="calendarDot now" /> В процессе: {ongoing}
                        </div>
                    )}
                    {completed > 0 && (
                        <div className="hoverRow">
                            <div className="calendarDot comp" /> Выполнено: {completed}
                        </div>
                    )}
                    {missed > 0 && (
                        <div className="hoverRow">
                            <div className="calendarDot skip" /> Пропущено: {missed}
                        </div>
                    )}
                    {planned > 0 && (
                        <div className="hoverRow">
                            <div className="calendarDot will" /> Запланировано: {planned}
                        </div>
                    )}
                    {completed === 0 &&
                        missed === 0 &&
                        planned === 0 &&
                        ongoing === 0 && (
                            <div className="hoverRow hrEmpty">В этот день нет привычек</div>
                        )}
                </>
            ) : (
                <div className={`hoverRow ${!comment ? "hrEmpty" : ""}`}>
                    {comment || "Нет комментария"}
                </div>
            )}
        </div>
    );

    return createPortal(content, document.body);
}