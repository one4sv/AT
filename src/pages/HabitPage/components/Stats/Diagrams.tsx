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

export default function Diagrams({
    mainRef
}: {
    mainRef: React.RefObject<HTMLDivElement | null>
}) {
    const { setDontHandle, setDontHandleOther } = useSideMenu()

    const sliderRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const touchStartX = useRef<number | null>(null);
    const dragging = useRef(false);

    const [slide, setSlide] = useState<{
        label: string
        value: string
        slide: boolean
    }>({
        label: "Выполнено",
        value: "comp",
        slide: false
    })

    const [period, setPeriod] = useState(periods[0].value)
    const [metric, setMetric] = useState(metrics[0].value)
    const [group, setGroup] = useState(groups[0].value)

    useEffect(() => {
        if (period === "thirty" || period === "week") {
            setGroup("day")
        }
    }, [period])

    // Обычное положение слайда
    useEffect(() => {
        if (!sliderRef.current || !wrapperRef.current) return

        const wrapperWidth = wrapperRef.current.clientWidth

        sliderRef.current.style.transition = "transform 0.3s ease-in-out"

        sliderRef.current.style.transform = slide.slide
            ? `translateX(-${wrapperWidth}px)`
            : "translateX(0)"
    }, [slide.slide])

    const handleTouchStart = (
        e: React.TouchEvent<HTMLDivElement>
    ) => {
        if (!sliderRef.current || !wrapperRef.current) return

        touchStartX.current = e.touches[0].clientX
        dragging.current = true

        if (slide.slide === false) {
            setDontHandle(false)
            setDontHandleOther(true)
        } else {
            setDontHandle(true)
            setDontHandleOther(false)
        }

        sliderRef.current.style.transition = "none"
    }

    const handleTouchMove = (
        e: React.TouchEvent<HTMLDivElement>
    ) => {
        if (
            touchStartX.current === null ||
            !dragging.current ||
            !sliderRef.current ||
            !wrapperRef.current
        ) {
            return
        }

        const currentX = e.touches[0].clientX
        const diff = currentX - touchStartX.current

        const wrapperWidth = wrapperRef.current.clientWidth

        const startPosition = slide.slide
            ? -wrapperWidth
            : 0

        let position = startPosition + diff

        position = Math.max(
            -wrapperWidth,
            Math.min(0, position)
        )
        if (slide.slide === false && diff < 0) {
            setDontHandleOther(true)
            setDontHandle(false)
            e.stopPropagation()
        }
        else if (slide.slide && diff < 0) {
            setDontHandle(true)
            setDontHandleOther(false)
        }


        sliderRef.current.style.transform =
            `translateX(${position}px)`
    }

    const handleTouchEnd = (
        e: React.TouchEvent<HTMLDivElement>
    ) => {
        if (
            touchStartX.current === null ||
            !sliderRef.current ||
            !wrapperRef.current
        ) {
            return
        }

        const touchEndX = e.changedTouches[0].clientX
        const diff = touchEndX - touchStartX.current

        const wrapperWidth = wrapperRef.current.clientWidth

        touchStartX.current = null
        dragging.current = false

        const threshold = wrapperWidth * 0.2

        if (Math.abs(diff) >= threshold) {
            if (diff < 0) {
                setSlide(prev => ({
                    ...prev,
                    slide: true
                }))
            } else {
                setSlide(prev => ({
                    ...prev,
                    slide: false
                }))
            }
        } else {
            sliderRef.current.style.transition =
                "transform 0.3s ease-in-out"

            sliderRef.current.style.transform = slide.slide
                ? `translateX(-${wrapperWidth}px)`
                : "translateX(0)"
        }

        setDontHandle(false)
        setDontHandleOther(false)
    }

    const handleTouchCancel = () => {
        if (!sliderRef.current || !wrapperRef.current) return
        
        const wrapperWidth = wrapperRef.current.clientWidth

        touchStartX.current = null
        dragging.current = false

        sliderRef.current.style.transition =
            "transform 0.3s ease-in-out"

        sliderRef.current.style.transform = slide.slide
            ? `translateX(-${wrapperWidth}px)`
            : "translateX(0)"

        setDontHandle(false)
        setDontHandleOther(false)
    }

    const goBack = () => {
        setSlide({
            label: "Выполнено",
            value: "comp",
            slide: false
        })
    }

    return (
        <div className="statsDivStats">
            <div
                className={`statsTitle ${slide.slide ? "slided" : ""}`}
                onClick={goBack}
            >
                {slide.slide ? (
                    <>
                        <CaretLeftIcon />
                        {slide.label}
                    </>
                ) : (
                    "Статистика"
                )}
            </div>

            <div
                className="statsDivWrapper"
                ref={wrapperRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
            >
                <div
                    className="statsDivSlider"
                    ref={sliderRef}
                >
                    <div className="statsDivSlide">
                        <OverallStats setSlide={setSlide} />
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

                        {slide.value === "comp" && (
                            <DoneDiagram
                                mainRef={mainRef}
                                period={period}
                                metric={metric}
                                group={group}
                            />
                        )}

                        {slide.value === "streak" && (
                            <StreakDiagram
                                mainRef={mainRef}
                                period={period}
                                group={group}
                            />
                        )}

                        {slide.value === "break" && (
                            <BreakDiagram
                                mainRef={mainRef}
                                period={period}
                                group={group}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}