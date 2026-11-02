import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { useGroup } from "../../components/hooks/GroupHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import Loader from "../../components/ts/Loader";
import { api } from "../../components/ts/api";
import { useHabits } from "../../components/hooks/HabitsHook";
import { useNote } from "../../components/hooks/NoteHook";
import AccHabits from "../Acc/components/AccHabits";
import GroupInfo from "./components/GroupInfo";
import GroupMembers from "./components/GroupMembers";
import "./scss/Group.scss";
export default function Group() {
    const {
        group,
        members,
        habits,
        refetchGroupWLoading,
        groupLoading,
        myPerms
    } = useGroup();
    const { setTitle } = usePageTitle();
    const { setDontHandle, setIsDragging, dontHandleOther } = useSideMenu();
    const { id } = useParams<{
        id: string;
    }>();
    const navigate = useNavigate();
    const { habits: myHabits, refetchHabits } = useHabits();
    const { showNotification } = useNote();
    const [ joiningActivity, setJoiningActivity ] = useState<number | null>(null);
    const [ collapsed, setCollapsed ] = useState(0);
    const [ selector, setSelector ] = useState<"habits" | "members">("habits");

    const collapsedRef = useRef(0);
    const collapseTarget = useRef(0);
    const collapseFrame = useRef<number | null>(null);

    useEffect(() => {
        collapsedRef.current = collapsed;
    }, [collapsed]);

    useEffect(() => {
        return () => {
            if (collapseFrame.current !== null) {
                cancelAnimationFrame(collapseFrame.current);
                collapseFrame.current = null;
            }
        };
    }, [id]);

    const animateCollapse = (target: number) => {
        if (collapseFrame.current !== null) {
            if (collapseTarget.current === target) return;
            cancelAnimationFrame(collapseFrame.current);
            collapseFrame.current = null;
        }

        const start = collapsedRef.current;
        const startTime = performance.now();
        const duration = 320;
        collapseTarget.current = target;

        if (start === target) return;

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = start + (target - start) * eased;

            collapsedRef.current = next;
            setCollapsed(next);

            if (progress < 1) {
                collapseFrame.current = requestAnimationFrame(animate);
            } else {
                collapseFrame.current = null;
            }
        };

        collapseFrame.current = requestAnimationFrame(animate);
    };
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const expanded = useRef(false);
    const isHorizontal = useRef(false);
    const canExpand = useRef(true);
    const isCollapsingGesture = useRef(false);
    const gestureMoved = useRef(false);
    const gestureBlocked = useRef(false);
    const sliderGesture = useRef(false);
    const sliderStartLeft = useRef(0);
    const sliderOwnsGesture = useRef(false);
    const accRef = useRef<HTMLDivElement>(null);
    const line = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
    const tabs = [{
        tab: "habits",
        name: "Активности"
    }, {
        tab: "members",
        name: "Участники"
    }];

    useEffect(
        () => {
            if (!id) {
                navigate("/", {
                    replace: true
                });
                return;
            }
            setSelector("habits");
            setCollapsed(0);
            if (contentRef.current) contentRef.current.scrollLeft = 0;
            if (line.current) line.current.style.transform = "translateX(0%)";
            void refetchGroupWLoading(id);
        },
        [id, navigate, refetchGroupWLoading]
    );

    useEffect(
        () => {
            if (!groupLoading && String(group.id) === id) setTitle(group.name);
        },
        [group, groupLoading, id, setTitle]
    );
    const getActiveSlideScrollTop = () => {
        if (!contentRef.current) return 0;

        const elWidth = contentRef.current.clientWidth;
        if (!elWidth) return 0;

        const idx = Math.round(contentRef.current.scrollLeft / elWidth);
        const slide = slideRefs.current[idx];

        return slide ? Math.max(0, slide.scrollTop) : 0;
    };

    const handleWheel = (e: WheelEvent) => {
        if (isMobile || dontHandleOther || e.ctrlKey) return;
        if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
        if ((e.target as Element).closest("input, textarea, [contenteditable='true'], .react-datepicker-popper")) return;
        if (getActiveSlideScrollTop() > 0) return;

        const target = e.deltaY > 0 ? 1 : 0;
        if (collapsedRef.current === target && collapseFrame.current === null) return;

        if (e.cancelable) e.preventDefault();
        animateCollapse(target);
    };

    useEffect(() => {
        const element = accRef.current;
        if (!element) return;

        element.addEventListener("wheel", handleWheel, { passive: false });
        return () => element.removeEventListener("wheel", handleWheel);
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        if (!line.current || !contentRef.current) return;
        const elScroll = contentRef.current.scrollLeft;
        const elWidth = contentRef.current.clientWidth;
        if (!elWidth) return;
        const proc = elScroll / elWidth * 100;
        line.current.style.transform = `translateX(${proc}%)`;
        if (proc > 50) setSelector("members"); else setSelector("habits");
    };
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (collapseFrame.current !== null) {
            cancelAnimationFrame(collapseFrame.current);
            collapseFrame.current = null;
        }
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        expanded.current = false;
        isHorizontal.current = false;
        canExpand.current = getActiveSlideScrollTop() === 0;
        isCollapsingGesture.current = false;
        gestureMoved.current = false;
        gestureBlocked.current = dontHandleOther;
        sliderGesture.current = false;
        sliderOwnsGesture.current = false;
    };

    const touchSliderStart = (e: React.TouchEvent<HTMLDivElement>) => {
        sliderGesture.current = true;
        sliderStartLeft.current = contentRef.current?.scrollLeft ?? 0;

        if (dontHandleOther) return;

        if (sliderStartLeft.current > 1) {
            sliderOwnsGesture.current = true;
            setDontHandle(true);
            e.stopPropagation();
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (dontHandleOther) {
            gestureBlocked.current = true;
            return;
        }

        if (gestureBlocked.current || e.touches.length !== 1) return;

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = touchStartY.current - currentY;
        const deltaX = currentX - touchStartX.current;

        if (!expanded.current) {
            if (Math.abs(deltaY) < 8 && Math.abs(deltaX) < 8) return;

            gestureMoved.current = true;
            isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
            expanded.current = true;

            if (
                isHorizontal.current &&
                sliderGesture.current &&
                (sliderStartLeft.current > 1 || deltaX < 0)
            ) {
                sliderOwnsGesture.current = true;
                setDontHandle(true);
            }

            touchStartY.current = currentY;
            touchStartX.current = currentX;
        }

        if (isHorizontal.current) {
            if (sliderOwnsGesture.current) {
                e.stopPropagation();
            }
            return;
        }

        const scrollTop = getActiveSlideScrollTop();

        if (scrollTop > 0) {
            canExpand.current = false;

            if (!isCollapsingGesture.current) return;
        }

        if (!isCollapsingGesture.current) {
            if (deltaY > 0 && collapsed < 1 && scrollTop === 0) {
                isCollapsingGesture.current = true;
            } else if (
                deltaY < 0 &&
                collapsed > 0 &&
                canExpand.current &&
                scrollTop === 0
            ) {
                isCollapsingGesture.current = true;
            } else {
                touchStartY.current = currentY;
                return;
            }

            setDontHandle(true);
        }

        e.stopPropagation();

        if (e.cancelable) {
            e.preventDefault();
        }
        setCollapsed(prev => {
            if (deltaY > 0) {
                const next = Math.max(0, Math.min(1, prev + deltaY / 700));
                collapsedRef.current = next;
                return next;
            }

            if (deltaY < 0 && canExpand.current) {
                const next = Math.max(0, Math.min(1, prev + deltaY / 700));
                collapsedRef.current = next;
                return next;
            }

            return prev;
        });

        touchStartY.current = currentY;
    };

    useEffect(() => {
        const element = accRef.current;
        if (!element) return;

        element.addEventListener("touchmove", handleTouchMove, { passive: false });

        return () => {
            element.removeEventListener("touchmove", handleTouchMove);
        };
    });

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        const wasCollapsingGesture = isCollapsingGesture.current;
        const ownedGesture = sliderOwnsGesture.current || wasCollapsingGesture;

        isHorizontal.current = false;
        isCollapsingGesture.current = false;
        sliderGesture.current = false;
        sliderOwnsGesture.current = false;

        if (wasCollapsingGesture) {
            animateCollapse(collapsedRef.current > 0.45 ? 1 : 0);
        }

        if (ownedGesture) {
            e.stopPropagation();
            setIsDragging(false);
            setDontHandle(false);
        }
    };

    const handleSlideClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (
            dontHandleOther ||
            gestureBlocked.current ||
            gestureMoved.current
        ) return;

        if (collapsedRef.current < 1) {
            e.preventDefault();
            e.stopPropagation();
            animateCollapse(1);
        }
    };

    const handleSelectorClick = (i: number) => {
        if (dontHandleOther || !contentRef.current) return;

        const elWidth = contentRef.current.clientWidth;
        if (!elWidth) return;

        const currentIdx = Math.round(contentRef.current.scrollLeft / elWidth);
        const activeSlide = slideRefs.current[currentIdx];

        if (currentIdx === i) {
            if (activeSlide && activeSlide.scrollTop > 0) {
                activeSlide.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                animateCollapse(collapsedRef.current === 0 ? 1 : 0);
            }
            return;
        }

        contentRef.current.scrollTo({
            left: elWidth * i,
            behavior: "smooth",
        });
    };

    if (groupLoading || String(group.id) !== id) return <Loader />;

    return (
        <div className="accDiv groupPage">
            <div
                className="acc"
                ref={accRef}
                onTouchStartCapture={handleTouchStart}
                onTouchEndCapture={handleTouchEnd}
                onTouchCancelCapture={handleTouchEnd}
            >
                <GroupInfo
                    key={id}
                    group={group}
                    collapsed={collapsed}
                />
                <div className="accContentSelector">
                    <div className="accContentIndicator" ref={line} />
                    <div className="accContentSelect" role="tablist" aria-label="Разделы группы">
                        {tabs.map(
                            (tab, i) => <button
                                key={tab.tab}
                                type="button"
                                className={`accContentButt ${selector === tab.tab ? "acbActive" : ""}`}
                                role="tab"
                                id={`group-tab-${tab.tab}`}
                                aria-selected={selector === tab.tab}
                                aria-controls={`group-panel-${tab.tab}`}
                                onClick={() => handleSelectorClick(i)}
                            >
                                {tab.name}
                            </button>
                        )}
                    </div>
                </div>
                <div
                    className="accContent"
                    ref={contentRef}
                    onScroll={handleScroll}
                    onTouchStartCapture={touchSliderStart}
                    style={{
                        overflowX: dontHandleOther ? "hidden" : undefined,
                        touchAction: dontHandleOther ? "pan-y" : undefined
                    }}
                >
                    <div
                        className="accSlide"
                        role="tabpanel"
                        id="group-panel-habits"
                        aria-labelledby="group-tab-habits"
                        onClickCapture={handleSlideClick}
                    >
                        <div
                            className="accContentSlide"
                            ref={el => {
                                slideRefs.current[0] = el;
                            }}
                            style={{ pointerEvents: isMobile && collapsed === 0 ? "none" : "all" }}
                        >
                            {habits.length ? <>
                                <AccHabits habits={habits} />
                                {habits.filter(h => h.chat_participation_mode === "optional" && !myHabits?.some(my => my.id === h.id)).map(h => <div className="settingInnerList" key={h.id}>
                                    <span>{h.name} — участие по желанию</span>
                                    <button type="button" className="settingInnerButt" disabled={joiningActivity !== null} onClick={async event => {
                                        event.stopPropagation();
                                        setJoiningActivity(h.id);
                                        try {
                                            const response = await api.post(`habits/${h.id}/join-chat`);
                                            if (!response.data.success) throw new Error();
                                            await refetchHabits();
                                            showNotification("success", "Вы присоединились к активности");
                                        } catch {
                                            showNotification("error", "Не удалось присоединиться к активности");
                                        } finally {
                                            setJoiningActivity(null);
                                        }
                                    }}>{joiningActivity === h.id ? "Присоединяемся..." : "Присоединиться"}</button>
                                </div>)}
                            </> : <div className="accNoPrivateAccess">
                                <CalendarBlankIcon size={28} aria-hidden="true" />
                                <span>Пока нет активностей</span>
                            </div>}
                        </div>
                    </div>
                    <div
                        className="accSlide"
                        role="tabpanel"
                        id="group-panel-members"
                        aria-labelledby="group-tab-members"
                        onClickCapture={handleSlideClick}
                    >
                        <div
                            className="accContentSlide"
                            ref={el => {
                                slideRefs.current[1] = el;
                            }}
                            style={{ pointerEvents: isMobile && collapsed === 0 ? "none" : "all" }}
                        >
                            <GroupMembers members={members} myPerms={myPerms} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
