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
    const startY = useRef(0);
    const touchActive = useRef(false);
    const direction = useRef<"" | "horizontal" | "vertical">("");
    const translateRef = useRef(100);
    const startTranslate = useRef(100);

    useEffect(() => {
        setMenuTranslate(showHabitMenu ? 0 : 100);
        translateRef.current = showHabitMenu ? 0 : 100;
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
        if (dontHandleOther || !showHabitMenu || e.touches.length !== 1) return;
        if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable=true]")) return;

        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTranslate.current = menuTranslate;
        touchActive.current = true;
        direction.current = "";
    };

    const handleMenuTouchMove = (e: React.TouchEvent) => {
        if (dontHandleOther || !touchActive.current || e.touches.length !== 1) return;

        const diff = e.touches[0].clientX - startX.current;
        const diffY = e.touches[0].clientY - startY.current;
        if (!direction.current && Math.max(Math.abs(diff), Math.abs(diffY)) > 8) {
            direction.current = Math.abs(diff) > Math.abs(diffY) ? "horizontal" : "vertical";
        }
        if (direction.current !== "horizontal") return;
        setDontHandle(true);
        setDragging(true);

        if (diff < 0) return;

        const translate = Math.min(
            100,
            startTranslate.current + (diff / window.innerWidth) * 100
        );

        setMenuTranslate(translate);
        translateRef.current = translate;
    };

    const handleMenuTouchEnd = () => {
        touchActive.current = false;
        if (direction.current !== "horizontal") return;
        direction.current = "";

        setDontHandle(false);
        setDragging(false);

        if (translateRef.current > 40) {
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
            onTouchCancel={() => {
                touchActive.current = false;
                if (direction.current === "horizontal") setDontHandle(false);
                direction.current = "";
                setDragging(false);
                setMenuTranslate(showHabitMenu ? 0 : 100);
                translateRef.current = showHabitMenu ? 0 : 100;
            }}
            style={{
                transform: `translateX(${menuTranslate}%)`,
                transition: dragging
                    ? "none"
                    : "transform .28s cubic-bezier(.22, 1, .36, 1)"
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
