import { CalendarBlankIcon } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { useGroup } from "../../components/hooks/GroupHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import Loader from "../../components/ts/Loader";
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
    const {
        setDontHandle,
        dontHandleOther
    } = useSideMenu();
    const { id } = useParams<{
        id: string;
    }>();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(0);
    const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
    const [isDraggingInfo, setIsDraggingInfo] = useState(false);
    const [selector, setSelector] = useState<"habits" | "members">("habits");
    const infoHeight = useRef(0);
    const collapseStartY = useRef(0);
    const collapseStartValue = useRef(0);
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
    const handleInfoHeight = useCallback((height: number) => {
        infoHeight.current = height;
    }, []);
    const getActiveSlideScrollTop = () => {
        if (!contentRef.current) return 0;
        const elWidth = contentRef.current.clientWidth;
        if (!elWidth) return 0;
        const idx = Math.round(contentRef.current.scrollLeft / elWidth);
        const slide = slideRefs.current[idx];
        return slide ? Math.max(0, slide.scrollTop) : 0;
    };

    useLayoutEffect(
        () => {
            const info = accRef.current?.querySelector<HTMLElement>(".accInfo");
            if (!info) return;
            const measure = () => {
                const hidden = collapsed === 1 && !isDraggingInfo && info.getBoundingClientRect().height <= 1;
                setIsInfoCollapsed(hidden);
                if (!hidden) {
                    slideRefs.current.forEach(
                        slide => {
                            if (slide) slide.scrollTop = 0;
                        }
                    );
                }
            };
            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(info);
            return () => observer.disconnect();
        }
    );
    const handleWheel = (e: WheelEvent) => {
        if (dontHandleOther || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        const info = accRef.current?.querySelector<HTMLElement>(".accInfo");
        const infoVisible = collapsed !== 1 || (info?.getBoundingClientRect().height ?? 0) > 1;
        if (infoVisible) {
            if (e.cancelable) e.preventDefault();
            if (e.deltaY > 0) setCollapsed(1);
            if (e.deltaY < 0) setCollapsed(0);
            return;
        }
        if (e.deltaY < 0 && getActiveSlideScrollTop() <= 1) {
            if (e.cancelable) e.preventDefault();
            setCollapsed(0);
        }
    };
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
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        expanded.current = false;
        isHorizontal.current = false;
        canExpand.current = getActiveSlideScrollTop() <= 1;
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
            if (Math.abs(deltaY) <= 5 && Math.abs(deltaX) <= 5) return;
            gestureMoved.current = true;
            isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
            expanded.current = true;
            if (isHorizontal.current && sliderGesture.current && (sliderStartLeft.current > 1 || deltaX < 0)) {
                sliderOwnsGesture.current = true;
                setDontHandle(true);
            }
        }
        if (isHorizontal.current) {
            if (sliderOwnsGesture.current) {
                e.stopPropagation();
            }
            return;
        }
        const scrollTop = getActiveSlideScrollTop();
        if (scrollTop > 1) {
            canExpand.current = false;
            if (!isCollapsingGesture.current) return;
        }
        if (!isCollapsingGesture.current) {
            const info = accRef.current?.querySelector<HTMLDivElement>(".accInfo");
            const height = infoHeight.current;
            if (!info || height <= 0) return;
            const visibleCollapsed = Math.max(0, Math.min(1, 1 - info.getBoundingClientRect().height / height));
            if (deltaY > 0 && visibleCollapsed < 1 && scrollTop <= 1) {
                isCollapsingGesture.current = true;
            } else if (deltaY < 0 && visibleCollapsed > 0 && canExpand.current && scrollTop <= 1) {
                isCollapsingGesture.current = true;
            } else {
                touchStartY.current = currentY;
                return;
            }
            collapseStartValue.current = visibleCollapsed;
            collapseStartY.current = touchStartY.current;
            setIsDraggingInfo(true);
            setDontHandle(true);
        }
        e.stopPropagation();
        if (e.cancelable) {
            e.preventDefault();
        }
        const next = collapseStartValue.current + (collapseStartY.current - currentY) / infoHeight.current;
        setCollapsed(Math.max(0, Math.min(1, next)));
        touchStartY.current = currentY;
    };

    useEffect(
        () => {
            const element = accRef.current;
            if (!element) return;
            element.addEventListener("touchmove", handleTouchMove, {
                passive: false
            });
            element.addEventListener("wheel", handleWheel, {
                passive: false
            });
            return () => {
                element.removeEventListener("touchmove", handleTouchMove);
                element.removeEventListener("wheel", handleWheel);
            };
        }
    );
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        const wasCollapsingGesture = isCollapsingGesture.current;
        const ownedGesture = sliderOwnsGesture.current || wasCollapsingGesture;
        isHorizontal.current = false;
        isCollapsingGesture.current = false;
        sliderGesture.current = false;
        sliderOwnsGesture.current = false;
        if (wasCollapsingGesture) {
            setIsDraggingInfo(false);
            setCollapsed(prev => prev > 0.45 ? 1 : 0);
        }
        if (ownedGesture) {
            e.stopPropagation();
            setDontHandle(false);
        }
    };
    const handleSlideClick = () => {
        if (dontHandleOther || gestureBlocked.current || gestureMoved.current) return;
        if (collapsed === 0) {
            setCollapsed(1);
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
                activeSlide.scrollTo(
                    {
                        top: 0,
                        behavior: "smooth"
                    }
                );
            } else {
                setCollapsed(prev => prev === 0 ? 1 : 0);
            }
            return;
        }
        contentRef.current.scrollTo(
            {
                left: elWidth * i,
                behavior: "smooth"
            }
        );
    };
    if (groupLoading || String(group.id) !== id) return <Loader />;

    return (
        <div className="accDiv groupPage">
            <div
                className="acc"
                ref={accRef}
                onTouchStartCapture={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <GroupInfo
                    key={id}
                    group={group}
                    collapsed={collapsed}
                    isDragging={isDraggingInfo}
                    onHeightChange={handleInfoHeight}
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
                    className={`accContent ${!isInfoCollapsed ? "accContentLocked" : ""}`}
                    ref={contentRef}
                    onScroll={handleScroll}
                    onTouchStart={touchSliderStart}
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
                        inert={selector !== "habits"}
                        onClick={isMobile ? handleSlideClick : undefined}
                    >
                        <div
                            className="accContentSlide"
                            ref={el => {
                                slideRefs.current[0] = el;
                            }}
                        >
                            {habits.length ? <AccHabits habits={habits} /> : <div className="accNoPrivateAccess">
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
                        inert={selector !== "members"}
                        onClick={isMobile ? handleSlideClick : undefined}
                    >
                        <div
                            className="accContentSlide"
                            ref={el => {
                                slideRefs.current[1] = el;
                            }}
                        >
                            <GroupMembers members={members} myPerms={myPerms} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
