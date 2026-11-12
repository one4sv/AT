import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Acc.scss";
import Skeleton from "../../components/ts/Skeleton";
import type { PrivateSettings } from "../../components/context/SettingsContext";
import AccInfo from "./components/AccInfo";
import AccHabits from "./components/AccHabits";
import AccPosts from "./components/AccPosts";
import { useAcc } from "../../components/hooks/AccHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";
import { CONTENT_REFRESH_EVENT, requestContentRefresh, type ContentRefreshEvent } from "../../components/ts/utils/contentRefresh";

export default function Acc() {
    const { t } = useTranslation("acc");
    const { user } = useUser();
    const {
        refetchAcc,
        loading,
        posts,
        habits,
        plans,
        acc,
        privateRules,
        refetchPosts,
        isMyAcc,
        setIsMyAcc
    } = useAcc();

    const { nick } = useParams();
    const { setTitle } = usePageTitle();
    const { setDontHandle, setIsDragging, dontHandleOther } = useSideMenu();
    const navigate = useNavigate();
    const location = useLocation();

    const [ collapsed, setCollapsed ] = useState(0);
    const [ selector, setSelector ] = useState<"habits" | "posts">("posts");

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
    }, [nick]);

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
    const touchOriginY = useRef(0);
    const collapseInitial = useRef(0);
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
    const pullRefresh = useRef<{ y: number; x: number; active: boolean } | null>(null);

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
    }, [nick, user.nick, user.id, location.search]);

    useEffect(() => {
        const onRefresh = (event: Event) => {
            const { scope, pathname } = (event as ContentRefreshEvent).detail;
            if (scope !== "page" || !pathname.startsWith("/acc") || !nick) return;

            void Promise.all([refetchAcc(nick, true), refetchPosts(nick, true)]);
        };
        window.addEventListener(CONTENT_REFRESH_EVENT, onRefresh);
        return () => window.removeEventListener(CONTENT_REFRESH_EVENT, onRefresh);
    }, [nick, refetchAcc, refetchPosts]);

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

        const proc = (elScroll / elWidth) * 100;

        line.current.style.transform = `translateX(${proc}%)`;

        if (proc > 50) setSelector("habits");
        else setSelector("posts");
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (collapseFrame.current !== null) {
            cancelAnimationFrame(collapseFrame.current);
            collapseFrame.current = null;
        }
        touchStartY.current = e.touches[0].clientY;
        touchOriginY.current = e.touches[0].clientY;
        collapseInitial.current = collapsedRef.current;
        touchStartX.current = e.touches[0].clientX;
        expanded.current = false;
        isHorizontal.current = false;
        canExpand.current = getActiveSlideScrollTop() === 0;
        isCollapsingGesture.current = false;
        gestureMoved.current = false;
        gestureBlocked.current = dontHandleOther;
        sliderGesture.current = false;
        sliderOwnsGesture.current = false;
        const target = e.target as Element;
        pullRefresh.current = collapsedRef.current <= 0.02 && getActiveSlideScrollTop() <= 2 &&
            !dontHandleOther && !!target.closest(".accContentSlide")
            ? { y: e.touches[0].clientY, x: e.touches[0].clientX, active: false }
            : null;
    };

    const touchSliderStart = () => {
        sliderGesture.current = true;
        sliderStartLeft.current = contentRef.current?.scrollLeft ?? 0;

        if (dontHandleOther) return;

        // Let vertical gestures reach the parent. Horizontal ownership is decided on move.
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

        if (pullRefresh.current) {
            const down = currentY - pullRefresh.current.y;
            const horizontal = Math.abs(currentX - pullRefresh.current.x);
            if (!pullRefresh.current.active && (down < -8 || horizontal > down)) {
                pullRefresh.current = null;
            } else if (down > 8 && down > horizontal * 1.5) {
                pullRefresh.current.active = true;
            }

            if (pullRefresh.current?.active && getActiveSlideScrollTop() <= 2) {
                gestureMoved.current = true;
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
                return;
            }
        }

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
            if (deltaY > 0 && collapsedRef.current < 1 && scrollTop === 0) {
                isCollapsingGesture.current = true;
            } else if (
                deltaY < 0 &&
                collapsedRef.current > 0 &&
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
        const pull = pullRefresh.current;
        pullRefresh.current = null;

        if (pull?.active) {
            const touch = e.changedTouches[0];
            const down = touch ? touch.clientY - pull.y : 0;
            const horizontal = touch ? Math.abs(touch.clientX - pull.x) : 0;

            if (down >= 95 && down > horizontal * 1.5 && nick) {
                requestContentRefresh("page", `/acc/${nick}`);
            }

            expanded.current = false;
            sliderGesture.current = false;
            sliderOwnsGesture.current = false;
            isCollapsingGesture.current = false;
            e.stopPropagation();
            return;
        }

        const wasCollapsingGesture = isCollapsingGesture.current;
        const ownedGesture = sliderOwnsGesture.current || wasCollapsingGesture;

        isHorizontal.current = false;
        isCollapsingGesture.current = false;
        sliderGesture.current = false;
        sliderOwnsGesture.current = false;

        if (wasCollapsingGesture) {
            const finalY = e.changedTouches[0]?.clientY ?? touchOriginY.current;
            const movedY = touchOriginY.current - finalY;
            // The panel follows the finger, but the released direction after
            // 32px decides the final side rather than a 45% travel threshold.
            animateCollapse(Math.abs(movedY) >= 32 ?
                (movedY > 0 ? 1 : 0) : (collapseInitial.current > 0.45 ? 1 : 0));
        }

        if (ownedGesture) {
            e.stopPropagation();
            setIsDragging(false);
            setDontHandle(false);
        }
    };

    const handleTouchCancel = () => {
        pullRefresh.current = null;
        const owned = isCollapsingGesture.current || sliderOwnsGesture.current;
        if (isCollapsingGesture.current) animateCollapse(collapseInitial.current > 0.45 ? 1 : 0);
        expanded.current = false;
        isHorizontal.current = false;
        isCollapsingGesture.current = false;
        sliderGesture.current = false;
        sliderOwnsGesture.current = false;
        if (owned) {
            setIsDragging(false);
            setDontHandle(false);
        }
    };

    const handleSlideClick = (event: React.MouseEvent<HTMLDivElement>) => {
        // When Info is fully open on mobile, the first content tap closes it.
        // Keep nested post/habit actions inactive until the next deliberate tap.
        if (!isMobile || dontHandleOther || gestureMoved.current || collapsedRef.current > 0.02) return;
        event.preventDefault();
        event.stopPropagation();
        animateCollapse(1);
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

    if (loading) return <Skeleton type="profile"/>;

    return (
        <div className="accDiv">
            <div
                className="acc"
                ref={accRef}
                onTouchStartCapture={handleTouchStart}
                onClick={e => e.stopPropagation()}
                onTouchEndCapture={handleTouchEnd}
                onTouchCancelCapture={handleTouchCancel}
            >
                <AccInfo acc={acc} collapsed={collapsed}/>
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
                    <div className="accSlide">
                        <div
                            className="accContentSlide"
                            ref={el => { slideRefs.current[0] = el; }}
                            onClickCapture={handleSlideClick}
                        >
                            <AccPosts
                                posts={posts}
                                habits={habits}
                                isMy={isMyAcc}
                                refetch={refetchAcc}
                            />
                        </div>
                    </div>
                    <div className="accSlide">
                        <div
                            className="accContentSlide"
                            ref={el => { slideRefs.current[1] = el; }}
                            onClickCapture={handleSlideClick}
                        >
                            <AccHabits
                                isMyAcc={isMyAcc}
                                habits={habits}
                                plans={plans}
                                canView={canView}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}