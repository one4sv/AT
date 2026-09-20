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
import CompJurnal from "./components/HabitInfo/CompJurnal";
import Schedule from "./components/Schedule/Schedule";
import ChosenDay from "./components/Calendar/ChosenDay";
import HabitSave from "./components/HabitInfo/HabitSave";
import { useSchedule } from "../../components/hooks/ScheduleHook";
import HabitExtraButts from "./components/HabitInfo/HabitExtraButts";
import { useHabits } from "../../components/hooks/HabitsHook";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import DoneButton from "./components/Habit/Complete/DoneButt";
import SvgRain from "../../components/modules/components/SvgRain";
import { BoxArrowDownIcon } from "@phosphor-icons/react";
import { useUpHabit } from "../../components/hooks/UpdateHabitHook";
import HabitChatMenu from "./components/HabitInfo/HabitChatMenu";

export interface HabitSlideProps {
    id: number;
    readOnly?: boolean;
    isArchived?: boolean;
    isMy?: boolean;
}

const params = {
    count: 50,
    durMin: 15,
    durMax: 32,
    sizeMin: 16,
    sizeMax: 38,
    refreshInterval: 2000,
    refreshCount: 10
};

const MIN_HABIT_HEIGHT = 85.5;
const MAX_HABIT_HEIGHT = 98;

export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarWLoading, calendarLoading } = useCalendar();
    const { loadHabitWLoading, habit, loadingHabit, habitSettings } = useTheHabit();
    const {
        showHabitMenu,
        setShowHabitMenu,
        showJurnal,
        setShowJurnal,
        showSettings,
        setShowSettings,
        setDontHandle,
        dontHandleOther,
        setShowChatMenu,
        showChatMenu,
        setDontHandleOther
    } = useSideMenu();

    const { schedules } = useSchedule();
    const { habitId } = useParams<{ habitId: string }>();
    const { setTitle } = usePageTitle();
    const { habits, loadingHabits } = useHabits();
    const { setNewOngoing } = useUpHabit();

    const [handleMenu, setHandleMenu] = useState(true);
    const [handleDelta, setHandleDelta] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [habitHeight, setHabitHeight] = useState(MIN_HABIT_HEIGHT);
    const [expandProgress, setExpandProgress] = useState(0);
    const [pullingState, setPullingState] = useState(false);
    const [menuTranslate, setMenuTranslate] = useState(100);
    const [dragging, setDragging] = useState(false);

    const startX = useRef(0);
    const startTranslate = useRef(100);
    const mainRef = useRef<HTMLDivElement | null>(null);

    const isSlided = showJurnal || showSettings || showChatMenu;

    const startY = useRef<number | null>(null);
    const pulling = useRef(false);
    const startHabitHeight = useRef(MIN_HABIT_HEIGHT);

    useEffect(() => {
        if (!showHabitMenu) {
            setShowSettings(false);
            setShowJurnal(false);
            setShowChatMenu(false);
        }
    }, [setShowChatMenu, setShowJurnal, setShowSettings, showHabitMenu]);

    useEffect(() => {
        if (habitId) {
            loadHabitWLoading(habitId);
            fetchCalendarHabit(habitId);
        } else {
            fetchCalendarWLoading();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId]);

    useEffect(() => {
        if (habitId && habit) {
            setTitle(habit.name);
        } else if (!habitId) {
            setTitle("Активности");
        }
    }, [habitId, habit, habit?.name, loadingHabit, setTitle]);

    const shouldShowSchedule =
        (!habitId && Object.values(schedules).some(arr => arr.length > 0)) ||
        (habit &&
            habitId === String(habit.id) &&
            habit.periodicity !== "sometimes" &&
            habitSettings.schedule);

    useEffect(() => {
        setMenuTranslate(showHabitMenu ? 0 : 100);
    }, [showHabitMenu]);

    const handleContentTouchStart = (e: React.TouchEvent) => {
        if (showHabitMenu || dontHandleOther) return;

        startX.current = e.touches[0].clientX;
        startTranslate.current = 100;
    };

    const handleContentTouchMove = (e: React.TouchEvent) => {
        if (!handleMenu || showHabitMenu || dontHandleOther) return;

        const diff = startX.current - e.touches[0].clientX;

        setDragging(true);

        if (diff < 5) {
            setMenuTranslate(100);
            return;
        }

        setHandleDelta(false);
        setDontHandle(true);

        const translate =
            100 - Math.min(100, ((diff - 5) / window.innerWidth) * 100);

        setMenuTranslate(translate);
    };

    const handleContentTouchEnd = () => {
        if (!dragging || showHabitMenu) {
            setDragging(false);
            return;
        }

        setHandleDelta(true);
        setDontHandle(false);
        setDragging(false);

        if (menuTranslate < 60) {
            setShowHabitMenu(true);
            setMenuTranslate(0);
        } else {
            setMenuTranslate(100);
        }
    };

    const handleMenuTouchStart = (e: React.TouchEvent) => {
        if (!setHandleMenu || dontHandleOther) return;

        setDontHandle(true);
        startX.current = e.touches[0].clientX;
        startTranslate.current = menuTranslate;
        setDragging(true);
    };

    const handleMenuTouchMove = (e: React.TouchEvent) => {
        if (dontHandleOther) return;

        setHandleDelta(false);
        setDontHandle(true);

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

        setDontHandle(false);
        setDragging(false);

        if (menuTranslate > 40) {
            setShowHabitMenu(false);
            setMenuTranslate(100);
        } else {
            setMenuTranslate(0);
        }
    };

    const handleHabitTouchStart = (e: React.TouchEvent) => {
        const container = mainRef.current;

        if (
            !container ||
            container.scrollTop > 0 ||
            dontHandleOther ||
            !handleDelta
        ) {
            return;
        }

        startY.current = e.touches[0].clientY;
        startHabitHeight.current = habitHeight;
        pulling.current = true;
        setPullingState(true);
    };

    const handleHabitTouchMove = (e: React.TouchEvent) => {
        if (!handleDelta || dontHandleOther) return;

        const container = mainRef.current;

        if (
            !pulling.current ||
            startY.current === null ||
            !container ||
            container.scrollTop > 0
        ) {
            return;
        }

        const delta = e.touches[0].clientY - startY.current;

        if (Math.abs(delta) > 5) {
            setDontHandle(true);
            setHandleMenu(false);
        }

        const heightDelta = (delta / window.innerHeight) * 100;

        const nextHeight = Math.max(
            MIN_HABIT_HEIGHT,
            Math.min(
                MAX_HABIT_HEIGHT,
                startHabitHeight.current + heightDelta
            )
        );

        const progress =
            (nextHeight - MIN_HABIT_HEIGHT) /
            (MAX_HABIT_HEIGHT - MIN_HABIT_HEIGHT);

        setHabitHeight(nextHeight);
        setExpandProgress(progress);
    };

    const handleHabitTouchEnd = () => {
        if (!pulling.current) return;

        const expanded = expandProgress >= 0.5;

        setIsExpanded(expanded);
        setHabitHeight(expanded ? MAX_HABIT_HEIGHT : MIN_HABIT_HEIGHT);
        setExpandProgress(expanded ? 1 : 0);
        setPullingState(false);

        setHandleMenu(true);
        setDontHandle(false);
        setDontHandleOther(false);

        pulling.current = false;
        startY.current = null;
    };

    if ((loadingHabit || loadingHabits) || calendarLoading) {
        return <Loader />;
    }

    const isMy =
        (habitId !== undefined &&
            habits?.some(h => String(h.id) === habitId)) ??
        false;

    const isArchived = !habit?.ongoing;
    const isReadOnly = !isMy || isArchived;

    return (
        <div className={`statsDiv ${isMobile ? "mobile" : ""}`}>
            {habitId && (
                <HabitName
                    habit={habit}
                    showHabitMenu={showHabitMenu}
                    setShowHabitMenu={setShowHabitMenu}
                    isReadOnly={isReadOnly}
                    expandProgress={expandProgress}
                    pulling={pullingState}
                />
            )}

            <div
                className={`StatsDivMain ${
                    habitId && !isExpanded ? "sdmwm" : ""
                }`}
                style={{
                    top: habitId ? "6vh" : "0",
                    overflow: isExpanded ? "hidden" : "auto",
                    ...(isMobile && habitId ? {
                        marginTop: `${5.5 * (1 - expandProgress)}vh`,
                        transition: pullingState ? "none" : undefined
                    } : {})
                }}
                ref={mainRef}
                onTouchStart={handleContentTouchStart}
                onTouchMove={handleContentTouchMove}
                onTouchEnd={handleContentTouchEnd}
            >
                <div className="StatsDivHabit">
                    {isMobile ? (
                        <>
                            {habitId && (
                                <div
                                    className={`mobileHabitLayout ${
                                        isExpanded ? "expanded" : ""
                                    }`}
                                    style={{
                                        height: `${habitHeight}dvh`,
                                        "--expand-progress": expandProgress,
                                        transition: pullingState
                                            ? "none"
                                            : undefined
                                    } as React.CSSProperties}
                                    onTouchStart={handleHabitTouchStart}
                                    onTouchMove={handleHabitTouchMove}
                                    onTouchEnd={handleHabitTouchEnd}
                                >
                                    <Complete isMy={!isReadOnly} />

                                    <DayComment
                                        id={habitId}
                                        isMy={!isReadOnly}
                                    />

                                    <DoneButton
                                        habitId={Number(habitId)}
                                    />

                                    {isExpanded && (
                                        <SvgRain
                                            className="svgRainInHabit"
                                            icons={1}
                                            params={params}
                                        />
                                    )}
                                </div>
                            )}

                            <Calendar />

                            {!habitId && <ChosenDay />}
                        </>
                    ) : (
                        <>
                            <Calendar />

                            {habitId ? (
                                <>
                                    <Complete isMy={!isReadOnly}/>
                                    <DayComment id={habitId!} isMy={!isReadOnly}/>
                                </>
                            ) : (
                                <ChosenDay />
                            )}
                        </>
                    )}
                </div>

                {shouldShowSchedule && (
                    <Schedule id={habitId} isMy={!isReadOnly}/>
                )}

                <Diagrams mainRef={mainRef} />
            </div>

            {habitId && habit && (
                <div
                    className={`habitMenu ${isMobile ? "mobile" : ""}`}
                    onTouchStart={handleMenuTouchStart}
                    onTouchMove={handleMenuTouchMove}
                    onTouchEnd={handleMenuTouchEnd}
                    style={{
                        transform: `translateX(${menuTranslate}%)`,
                        transition: dragging
                            ? "none"
                            : "transform .1s ease"
                    }}
                >
                    <div
                        className={`habitSlider ${
                            showSettings || showJurnal || showChatMenu
                                ? "toSlide"
                                : ""
                        }`}
                    >
                        <div className="habitSlide">
                            <HabitInfo
                                habit={habit}
                                readOnly={isReadOnly}
                            />

                            {!isReadOnly && (
                                <HabitExtraButts
                                    id={Number(habitId)}
                                    setShowSettings={setShowSettings}
                                    setShowJurnal={setShowJurnal}
                                    setShowChatMenu={setShowChatMenu}
                                />
                            )}

                            {isMy && isArchived && (
                                <div
                                    className="redHabitBlock but danger"
                                    onClick={() =>
                                        isArchived !== undefined &&
                                        setNewOngoing(habit.id, isArchived)
                                    }
                                >
                                    <span className="redHabitSpan but">
                                        <BoxArrowDownIcon />
                                        Разархивировать
                                    </span>

                                    <div className="habitSettingHint">
                                        Активность снова станет выполнимой и
                                        вернётся в список текущих.
                                    </div>
                                </div>
                            )}
                        </div>

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
                                <CompJurnal id={habit.id} />
                            )}

                            {showChatMenu && (
                                <HabitChatMenu
                                    readOnly={isReadOnly}
                                    id={habit.id}
                                    isArchived={isArchived}
                                    isMy={isMy}
                                />
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