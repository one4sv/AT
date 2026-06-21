import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useTheHabit } from "../../components/hooks/TheHabitHook";
import { useCalendar } from "../../components/hooks/CalendarHook";
import Loader from "../../components/ts/Loader";
import "./scss/habitInfo.scss";
import "./scss/redHabit.scss";
import HabitInfo from "./components/HabitInfo/HabitInfo";
import { isMobile } from "react-device-detect";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import HabitSettings from "./components/HabitInfo/HabitSettings";
import HabitName from "./components/HabitInfo/HabitName";
import Calendar from "./components/Calendar/Calendar";
import Diagrams from "./components/Stats/Diagrams";
import DayComment from "./components/Habit/Comment/DayComment";
import Complete from "./components/Habit/Complete/Complete";
import CompJurnal from "./components/Calendar/CompJurnal";
import Schedule from "./components/Schedule/Schedule";
import ChosenDay from "./components/Calendar/ChosenDay";
import { useDiagrams } from "../../components/hooks/DiagramHook";
import HabitSave from "./components/HabitInfo/HabitSave";
import { useSchedule } from "../../components/hooks/ScheduleHook";
import HabitExtraButts from "./components/HabitInfo/HabitExtraButts";
import { useHabits } from "../../components/hooks/HabitsHook";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import DoneButton from "./components/Habit/Complete/DoneButt";
import SvgRain from "../../components/modules/components/SvgRain";

export interface HabitSlideProps {
    id: number;
    readOnly?: boolean;
    isArchived?:boolean,
    isMy?:boolean
}

const params={
    count: 50,
    durMin: 15,
    durMax: 32,
    sizeMin: 16,
    sizeMax: 38,
    refreshInterval: 2000,
    refreshCount: 10
}

export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarWLoading, calendarLoading } = useCalendar()
    const { loadHabitWLoading, habit, loadingHabit, habitSettings } = useTheHabit()
    const { showHabitMenu, setShowHabitMenu, showJurnal, setShowJurnal, showSettings, setShowSettings, setDontHandle, dontHandleOther} = useSideMenu()
    const { schedules } = useSchedule()
    const { habitId } = useParams<{ habitId: string }>();
    const { setTitle } = usePageTitle()
    const { mainRef } = useDiagrams()
    const { habits } = useHabits()

    const [isExpanded, setIsExpanded] = useState(false);
    const startY = useRef<number | null>(null);
    const pulling = useRef(false);
    const [menuTranslate, setMenuTranslate] = useState(100);
    const [dragging, setDragging] = useState(false);

    const startX = useRef(0);
    const startTranslate = useRef(100);
    const isSlided = showJurnal || showSettings
    
    useEffect(() => {
        if (!showHabitMenu) {
            setShowSettings(false)
            setShowJurnal(false)
        }
    }, [showHabitMenu])

    useEffect(() => {
        if (habitId) {
            loadHabitWLoading(habitId)
            fetchCalendarHabit(habitId)
        } else {
            fetchCalendarWLoading()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId]);

    useEffect(() => {
        if (habitId && habit) {
            setTitle(habit.name)
        } else if (!habitId) {
            setTitle("Активности")
        }
    }, [habitId, habit, habit?.name, loadingHabit, setTitle]);

    const shouldShowSchedule =
        (!habitId && Object.values(schedules).some(arr => arr.length > 0)) ||
        (habit && habitId === String(habit.id) && habit.periodicity !== "sometimes" && habitSettings.schedule);

    useEffect(() => {
        setMenuTranslate(showHabitMenu ? 0 : 100);
    }, [showHabitMenu]);

    const handleContentTouchStart = (e: React.TouchEvent) => {
        if (showHabitMenu || dontHandleOther) return;
        startX.current = e.touches[0].clientX;
        startTranslate.current = 100;
        setDragging(true);
    };

    const handleContentTouchMove = (e: React.TouchEvent) => {
        if (!dragging || showHabitMenu || dontHandleOther) return;
        setDontHandle(true)

        const diff = startX.current - e.touches[0].clientX;

        if (diff < 0) return;

        const translate =
            100 - Math.min(100, (diff / window.innerWidth) * 100);

        setMenuTranslate(translate);
    };

    const handleContentTouchEnd = () => {
        if (!dragging || showHabitMenu) return;
        setDontHandle(false)

        setDragging(false);

        if (menuTranslate < 60) {
            setShowHabitMenu(true);
            setMenuTranslate(0);
        } else {
            setMenuTranslate(100);
        }
    };

    const handleMenuTouchStart = (e: React.TouchEvent) => {
        if (dontHandleOther) return
        startX.current = e.touches[0].clientX;
        startTranslate.current = menuTranslate;
        setDragging(true);
    };

    const handleMenuTouchMove = (e: React.TouchEvent) => {
        if (!dragging || dontHandleOther) return;
        setDontHandle(true)
        const diff = e.touches[0].clientX - startX.current;

        if (diff < 0) return;

        const translate = Math.min(
            100,
            startTranslate.current + (diff / window.innerWidth) * 100
        );

        setMenuTranslate(translate);
    };

    const handleMenuTouchEnd = () => {
        if (!dragging) return;
        setDontHandle(false)
        setDragging(false);

        if (menuTranslate > 40) {
            setShowHabitMenu(false);
            setMenuTranslate(100);
        } else {
            setMenuTranslate(0);
        }
    };

    if (loadingHabit || calendarLoading) {
        return <Loader/>
    }

    const isMy = (habitId !== undefined && habits?.some(h => String(h.id) === habitId)) ?? false
    const isArchived = !habit?.ongoing
    const isReadOnly = !isMy || isArchived

    return (
        <div className={`statsDiv ${isMobile ? "mobile" : ""}`}>
            {habitId && <HabitName habit={habit} showHabitMenu={showHabitMenu} setShowHabitMenu={setShowHabitMenu} isReadOnly={isReadOnly} isExp={isExpanded}/>}
            <div className={`StatsDivMain ${habitId && !isExpanded? "sdmwm" : ""}`} 
                style={{top:habitId ? "6vh" : "0", overflow:isExpanded ? "hidden" : "auto"}} 
                ref={mainRef}
                onTouchStart={isMobile ? handleContentTouchStart : undefined}
                onTouchMove={isMobile ? handleContentTouchMove : undefined}
                onTouchEnd={isMobile ? handleContentTouchEnd : undefined}
            >
                <div className="StatsDivHabit">
                    {isMobile ? (
                        <>
                            {habitId && (
                                <>
                                    <div
                                        className={`mobileHabitLayout ${isExpanded ? "expanded" : ""}`}
                                        style={{
                                            height: isExpanded ? '92vh' : '77.5vh'
                                        }}
                                        onTouchStart={(e) => {
                                            if (window.scrollY !== 0) return;

                                            startY.current = e.touches[0].clientY;
                                            pulling.current = true;
                                        }}
                                        onTouchMove={(e) => {
                                            if (!pulling.current || startY.current === null) return;

                                            const delta = e.touches[0].clientY - startY.current;

                                            if (delta > 80 && !isExpanded) {
                                                setIsExpanded(true);
                                                pulling.current = false;
                                            }

                                            if (delta < -100 && isExpanded) {
                                                pulling.current = false;
                                                setIsExpanded(false);
                                            }
                                        }}
                                        onTouchEnd={() => {
                                            startY.current = null;
                                            pulling.current = false;
                                        }}
                                    >
                                        <Complete isMy={!isReadOnly}/>
                                        <DayComment id={habitId!} isMy={!isReadOnly}/>
                                        <DoneButton habitId={Number(habitId)}/>
                                        {isExpanded && <SvgRain className="svgRainInHabit" icons={1} params={params}/>}
                                    </div>
                                </>
                            )}
                            <Calendar/>
                            {!habitId && <ChosenDay/>}
                        </>
                    ) : (
                        <>
                        <Calendar/>
                            {habitId ? (
                                <>
                                    <Complete isMy={!isReadOnly}/>
                                    <DayComment id={habitId!} isMy={!isReadOnly}/>
                                </>
                            ) : (
                                <ChosenDay/>
                            )}
                        </>
                    )}
                </div>
                {shouldShowSchedule && (
                    <Schedule id={habitId} isMy={!isReadOnly}/>
                )}
                <Diagrams/>
            </div>
            {habitId && habit && (
                <div
                    className={`habitMenu ${isMobile ? "mobile" : ""}`}
                    onTouchStart={isMobile ? handleMenuTouchStart : undefined}
                    onTouchMove={isMobile ? handleMenuTouchMove : undefined}
                    onTouchEnd={isMobile ? handleMenuTouchEnd : undefined}
                    style={{
                        transform: `translateX(${menuTranslate}%)`,
                        transition: dragging ? "none" : "transform .3s ease"
                    }}
                >
                    <div className={`habitSlider ${showSettings || showJurnal ? "toSlide" : ""}`}>

                        {/* Слайд 1 */}
                        <div className="habitSlide">
                            <HabitInfo habit={habit} readOnly={isReadOnly}/>
                            <HabitExtraButts
                                habit={habit}
                                readOnly={isReadOnly}
                                id={Number(habitId)}
                                setShowSettings={setShowSettings}
                                setShowJurnal={setShowJurnal}
                            />
                        </div>

                        {/* Слайд 2 */}
                        <div className="habitSlide">
                            {showSettings && (
                                <HabitSettings
                                    readOnly={isReadOnly}
                                    id={habit.id}
                                    isArchived={isArchived}
                                    isMy={isMy}
                                />
                            )}
                            {showJurnal && (
                                <CompJurnal id={habit.id}/>
                            )}
                        </div>

                    </div>
                    <HabitSave
                        readOnly={isReadOnly}
                        id={habit.id}
                        archived={!habit.ongoing}
                        isSlided={isSlided}
                    />
                </div>
            )}
        </div>
    );
}

