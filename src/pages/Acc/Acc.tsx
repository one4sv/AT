import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Acc.scss";
import Loader from "../../components/ts/Loader";
import type { PrivateSettings } from "../../components/context/SettingsContext";
import AccInfo from "./components/AccInfo";
import AccHabits from "./components/AccHabits";
import AccPosts from "./components/AccPosts";
import { useAcc } from "../../components/hooks/AccHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";

export default function Acc() {
    const { t } = useTranslation("acc");
    const { user } = useUser();
    const {
        refetchAcc,
        loading,
        posts,
        habits,
        acc,
        privateRules,
        refetchPosts,
        isMyAcc,
        setIsMyAcc
    } = useAcc();

    const { nick } = useParams();
    const { setTitle } = usePageTitle();
    const { setDontHandle, dontHandleOther } = useSideMenu();
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(0);
    const [selector, setSelector] =
        useState<"habits" | "posts">("posts");

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

    const tabs: { tab: "habits" | "posts", name: string, nameMy?: string }[] = [
        { tab: "posts", name: t("tabs.posts") },
        { tab: "habits", name: t("tabs.activities") },
    ];

    const canView = useCallback(
        (field: keyof PrivateSettings) =>
            isMyAcc || privateRules[field] !== "nobody",
        [isMyAcc, privateRules]
    );

    useEffect(() => {
        if (!nick) {
            navigate(`/acc/${user.nick}`, { replace: true });
            return;
        }

        const my = nick === user.nick;
        setIsMyAcc(my);
        setSelector("posts");

        Promise.all([refetchAcc(nick), refetchPosts(nick)]);
    }, [nick, user.nick, user.id]);

    useEffect(() => {
        if (acc && !loading && acc.nick) {
            setTitle(acc.nick);
        }
    }, [acc, loading, nick, setTitle]);

    const getActiveSlideScrollTop = () => {
        if (!contentRef.current) return 0;

        const elWidth = contentRef.current.clientWidth;
        if (!elWidth) return 0;

        const idx = Math.round(contentRef.current.scrollLeft / elWidth);
        const slide = slideRefs.current[idx];

        return slide ? Math.max(0, slide.scrollTop) : 0;
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (dontHandleOther) return;

        const scrollTop = getActiveSlideScrollTop();
        if (scrollTop > 0) return;

        if (e.deltaY > 0) setCollapsed(1);
        if (e.deltaY < 0) setCollapsed(0);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        if (!line.current || !contentRef.current) return;

        const elScroll = contentRef.current.scrollLeft;
        const elWidth = contentRef.current.clientWidth;
        if (!elWidth) return;

        const proc = (elScroll / elWidth) * 100;

        line.current.style.transform = `translateX(${proc}%)`;

        if (proc > 50) setSelector("habits");
        else setSelector("posts");
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
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
            if (Math.abs(deltaY) <= 5 && Math.abs(deltaX) <= 5) return;

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
                return Math.max(0, Math.min(1, prev + deltaY / 700));
            }

            if (deltaY < 0 && canExpand.current) {
                return Math.max(0, Math.min(1, prev + deltaY / 700));
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
            setCollapsed(prev => (prev > 0.45 ? 1 : 0));
        }

        if (ownedGesture) {
            e.stopPropagation();
            setDontHandle(false);
        }
    };

    const handleSlideClick = () => {
        if (
            dontHandleOther ||
            gestureBlocked.current ||
            gestureMoved.current
        ) return;

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
                activeSlide.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                setCollapsed(prev => (prev === 0 ? 1 : 0));
            }
            return;
        }

        contentRef.current.scrollTo({
            left: elWidth * i,
            behavior: "smooth",
        });
    };

    if (loading) return <Loader />;

    return (
        <div className="accDiv">
            <div
                className="acc"
                ref={accRef}
                onTouchStartCapture={handleTouchStart}
                onWheel={handleWheel}
                onTouchEndCapture={handleTouchEnd}
                onTouchCancelCapture={handleTouchEnd}
            >
                <AccInfo acc={acc} canView={canView} collapsed={collapsed}/>
                <div className="accContentSelector">
                    <div className="accContentIndicator" ref={line} />
                    <div className="accContentSelect">
                        {tabs.map((tab, i) => (
                            <div
                                key={tab.name}
                                className={`accContentButt ${selector === tab.tab && "acbActive"}`}
                                onClick={() => handleSelectorClick(i)}
                            >
                                {tab.nameMy && isMyAcc ? tab.nameMy : tab.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="accContent"
                    ref={contentRef}
                    style={{
                        overflowX: dontHandleOther ? "hidden" : undefined,
                        touchAction: dontHandleOther ? "pan-y" : undefined,
                    }}
                    onScroll={handleScroll}
                    onTouchStartCapture={touchSliderStart}
                >
                    <div className="accSlide" onClick={isMobile ? handleSlideClick : undefined}>
                        <div
                            className="accContentSlide"
                            ref={el => { slideRefs.current[0] = el; }}
                            style={{ pointerEvents: `${isMobile && collapsed === 0 ? "none" : "all"}` }}
                        >
                            <AccPosts
                                posts={posts}
                                habits={habits}
                                isMy={isMyAcc}
                                refetch={refetchAcc}
                            />
                        </div>
                    </div>
                    <div className="accSlide" onClick={isMobile ? handleSlideClick : undefined}>
                        <div
                            className="accContentSlide"
                            ref={el => { slideRefs.current[1] = el; }}
                            style={{ pointerEvents: `${isMobile && collapsed === 0 ? "none" : "all"}` }}
                        >
                            <AccHabits
                                isMyAcc={isMyAcc}
                                habits={habits}
                                canView={canView}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}