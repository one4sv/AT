import { BoxArrowDownIcon } from "@phosphor-icons/react";
import HabitSave from "./HabitSave";
import HabitInfo from "./HabitInfo";
import HabitExtraButts from "./HabitExtraButts";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";
import HabitSettings from "./HabitSettings";
import CompJurnal from "./CompJurnal";
import HabitChatMenu from "./HabitChatMenu";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import { useEffect, useRef, useState } from "react";

export default function HabitMenu ({isMy, isArchived, isReadOnly}:{isMy:boolean, isArchived:boolean, isReadOnly: boolean}) {
    const { habit } = useTheHabit()
    const { showSlide, showHabitMenu, setShowHabitMenu, dontHandleOther, setDontHandle } = useSideMenu()
    const { setNewOngoing } = useUpHabit()
    
    const [menuTranslate, setMenuTranslate] = useState(100);
    const [dragging, setDragging] = useState(false);

    const startX = useRef(0);
    const startTranslate = useRef(100);

    useEffect(() => {
        setMenuTranslate(showHabitMenu ? 0 : 100);
    }, [showHabitMenu]);

    const renderSlide = () => {
        switch (showSlide) {
            case "settings":
                return (
                    <HabitSettings
                        readOnly={isReadOnly}
                        isArchived={isArchived}
                        isMy={isMy}
                    />
                )
            case "journal":
                return (
                    <CompJurnal/>
                )
            case "chat":
                return (
                    <HabitChatMenu
                        readOnly={isReadOnly}
                        isArchived={isArchived}
                        isMy={isMy}
                    />
                )
        }
    }
        const handleMenuTouchStart = (e: React.TouchEvent) => {
        if (dontHandleOther) return;

        setDontHandle(true);
        startX.current = e.touches[0].clientX;
        startTranslate.current = menuTranslate;
        setDragging(true);
    };

    const handleMenuTouchMove = (e: React.TouchEvent) => {
        if (dontHandleOther) return;

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

    if (!habit) return null
    
    return (
        <div
            className="habitMenu"
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
                className={`habitSlider ${showSlide
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
                        <HabitExtraButts/>
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
                    {renderSlide()}
                </div>
            </div>

            <HabitSave
                readOnly={isReadOnly} setMenuTranslate={setMenuTranslate}
            />
        </div>
    )
}