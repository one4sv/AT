import StatsFilters from "./StatsFilters";
import "../../scss/Diagrams.scss"
import React, { useEffect, useRef, useState } from "react";
import OverallStats from "./Diagrams/OverallStats";
import { groups, metrics, periods } from "../../utils/filters";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";
import DoneDiagram from "./Diagrams/DoneDiagram";
import StreakDiagram from "./Diagrams/StreakDiagram";
import BreakDiagram from "./Diagrams/BreakDiagram";

type StatsSlide = {
    label: string;
    value: string;
    slide: boolean;
};

export default function Diagrams({
    mainRef
}: {
    mainRef: React.RefObject<HTMLDivElement | null>
}) {
    const { setDontHandle } = useSideMenu();
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const gesture = useRef<"none" | "vertical" | "horizontal">("none");

    const [slide, setSlide] = useState<StatsSlide>({ label: "Выполнено", value: "comp", slide: false });
    const [period, setPeriod] = useState(periods[0].value);
    const [metric, setMetric] = useState(metrics[0].value);
    const [group, setGroup] = useState(groups[0].value);

    useEffect(() => {
        if (period === "thirty" || period === "week") setGroup("day");
    }, [period]);

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length !== 1 ||
            (event.target as Element).closest("button, input, .statsFilter, .selectList")) {
            touchStart.current = null;
            return;
        }

        touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        gesture.current = "none";
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!touchStart.current || event.touches.length !== 1) return;

        const dx = event.touches[0].clientX - touchStart.current.x;
        const dy = event.touches[0].clientY - touchStart.current.y;

        if (gesture.current === "none" && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            gesture.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
            if (gesture.current === "horizontal") setDontHandle(true);
        }

        if (gesture.current === "horizontal") event.stopPropagation();
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (touchStart.current && gesture.current === "horizontal") {
            const dx = event.changedTouches[0].clientX - touchStart.current.x;
            if (Math.abs(dx) > 48) {
                setSlide(current => ({ ...current, slide: dx < 0 }));
            }
        }

        touchStart.current = null;
        gesture.current = "none";
        setDontHandle(false);
    };

    const handleTouchCancel = () => {
        touchStart.current = null;
        gesture.current = "none";
        setDontHandle(false);
    };

    const goBack = () => {
        if (slide.slide) setSlide({ label: "Выполнено", value: "comp", slide: false });
    };

    return (
        <div className="statsDivStats">
            <div className={`statsTitle ${slide.slide ? "slided" : ""}`} onClick={goBack}>
                {slide.slide ? <>
                    <CaretLeftIcon/>
                    {slide.label}
                </> : "Статистика"}
            </div>

            <div className="statsDivWrapper"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}>
                <div className={`statsDivSlider ${slide.slide ? "toDetails" : ""}`}>
                    <div className="statsDivSlide">
                        <OverallStats setSlide={setSlide}/>
                    </div>
                    <div className="statsDivSlide">
                        <StatsFilters
                            period={period}
                            setPeriod={setPeriod}
                            metric={metric}
                            setMetric={setMetric}
                            group={group}
                            setGroup={setGroup}
                            slide={slide.value}
                        />

                        {slide.value === "comp" && <DoneDiagram
                            mainRef={mainRef}
                            period={period}
                            metric={metric}
                            group={group}
                        />}
                        {slide.value === "streak" && <StreakDiagram
                            mainRef={mainRef}
                            period={period}
                            group={group}
                        />}
                        {slide.value === "break" && <BreakDiagram
                            mainRef={mainRef}
                            period={period}
                            group={group}
                        />}
                    </div>
                </div>
            </div>
        </div>
    );
}
