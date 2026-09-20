import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Acc.scss";
import Loader from "../../components/ts/Loader";
import type { PrivateSettings } from "../../components/context/SettingsContext";
import AccInfo from "./components/AccInfo";
import AccHabits from "./components/AccHabits";
import AccPosts from "./components/AccPosts";
import AccMedia from "./components/AccMedia";
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
        media,
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
    const { setDontHandle, dontHandleOther} = useSideMenu();
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(0);
    const [selector, setSelector] =
        useState<"sended" | "habits" | "posts">("sended");

    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const expanded = useRef(false);
    const isHorizontal = useRef(false);
    const canExpand = useRef(true);
    const line = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

    const tabs: { tab: "sended" | "habits" | "posts", name: string, nameMy?: string }[] = [
        { tab: "sended", name: t("tabs.files"), nameMy: t("tabs.favorites") },
        { tab: "habits", name: t("tabs.activities") },
        { tab: "posts", name: t("tabs.posts") },
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
        setSelector("sended");

        Promise.all([refetchAcc(nick), refetchPosts(nick)]);
    }, [nick, user.nick, user.id]);

    useEffect(() => {
        if (acc && !loading && acc.nick === nick) {
            setTitle(acc.username || acc.nick);
        }
    }, [acc, loading, nick]);

    const getActiveSlideScrollTop = () => {
        if (!contentRef.current) return 0;
        const elWidth = contentRef.current.clientWidth;
        const idx = Math.round(contentRef.current.scrollLeft / elWidth);
        const slide = slideRefs.current[idx];
        return slide ? slide.scrollTop : 0;
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const scrollTop = getActiveSlideScrollTop();
        if (scrollTop > 0) return;
        if (e.deltaY > 0) setCollapsed(1);
        if (e.deltaY < 0 && scrollTop === 0) setCollapsed(0);
    };

    const handleScroll = () => {
        if (!line.current || !contentRef.current) return;
        const elScroll = contentRef.current.scrollLeft;
        const elWidth = contentRef.current.clientWidth;
        const proc = (elScroll / elWidth) * 100;
        line.current.style.transform = `translateX(${proc}%)`;
        if (proc > 0) setDontHandle(true)
        if (proc > 150) setSelector("posts");
        else if (proc > 50) setSelector("habits");
        else setSelector("sended");
    };
    
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        expanded.current = false;
        isHorizontal.current = false;
        canExpand.current = true;
    };

    const touchSliderStart = () => {
        if (selector !== "sended") {
            setDontHandle(true)
        }
    }

    const touchSliderMove = () => {
        if (collapsed === 1) return
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (dontHandleOther) return;
        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = touchStartY.current - currentY;
        const deltaX = currentX - touchStartX.current;

        if (!expanded.current) {
            if (Math.abs(deltaY) <= 5 && Math.abs(deltaX) <= 5) return;

            // Определяем направление после порога 5px
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                isHorizontal.current = true;
            }
            expanded.current = true;
            touchStartY.current = currentY;
            touchStartX.current = currentX;
            return;
        }

        // Если уже определили горизонтальный свайп — коллапс не трогаем
        if (isHorizontal.current) return;

        const scrollTop = getActiveSlideScrollTop();

        // Если слайд проскроллен — не взаимодействуем с collapsed
        if (scrollTop > 0) return;

        if (Math.abs(deltaY) > 5) setDontHandle(true)

        setCollapsed(prev => {
            // Свайп вверх (сворачиваем)
            if (deltaY > 0) {
                canExpand.current = false; // после сворачивания в этом жесте развернуть нельзя
                const next = prev + deltaY * 0.01;
                return Math.max(0, Math.min(1, next));
            }

            // Свайп вниз (разворачиваем) — только если canExpand и слайд наверху
            if (deltaY < 0 && canExpand.current && scrollTop === 0) {
                const next = prev + deltaY * 0.01;
                return Math.max(0, Math.min(1, next));
            }

            return prev;
        });

        touchStartY.current = currentY;
    };


    const handleTouchEnd = () => {
        isHorizontal.current = false;
        setCollapsed(prev => prev > 0.5 ? 1 : 0);
    };

    const handleSlideClick = () => {
        if (collapsed === 0) {
            setCollapsed(1);
        }
        // если уже collapsed — клик просто проходит дальше
    };

    const handleSelectorClick = (i: number) => {
        if (!contentRef.current) return;

        const elWidth = contentRef.current.clientWidth;
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
            <div className="acc"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onWheel={handleWheel}
                onTouchEnd={handleTouchEnd}
            >
                <AccInfo acc={acc} canView={canView} collapsed={collapsed}/>
                <div className="accContentSelector">
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
                    <div className="accContentLine">
                        <div className="accContentLineIndicator" ref={line} />
                    </div>
                </div>

                <div className="accContent" 
                    ref={contentRef} 
                    onScroll={() => handleScroll()} 
                    onTouchStart={() => touchSliderStart()}
                    onTouchMove={() => touchSliderMove()}
                    onScrollEnd={() => setDontHandle(false)}
                    style={{overflowX: `${dontHandleOther ? "hidden" : "scroll"}`}}
                >
                    <div className="accSlide" onClick={isMobile ? handleSlideClick : undefined}>
                        <div
                            className="accContentSlide accMedia"
                            ref={el => { slideRefs.current[0] = el; }}
                            style={{pointerEvents:`${isMobile && collapsed === 0 ? "none" : "all"}`}}
                        >
                            {!isMyAcc && <AccMedia media={media} />}
                        </div>
                    </div>
                    <div className="accSlide" onClick={isMobile ? handleSlideClick : undefined} >
                        <div
                            className="accContentSlide"
                            ref={el => { slideRefs.current[1] = el; }}
                            style={{pointerEvents:`${isMobile && collapsed === 0 ? "none" : "all"}`}}
                        >
                            <AccHabits
                                isMyAcc={isMyAcc}
                                habits={habits}
                                canView={canView}
                            />
                        </div>
                    </div>
                    <div className="accSlide" onClick={isMobile ? handleSlideClick : undefined} >
                        <div
                            className="accContentSlide"
                            ref={el => { slideRefs.current[2] = el; }}
                            style={{pointerEvents:`${isMobile && collapsed === 0 ? "none" : "all"}`}}
                        >
                            <AccPosts
                                posts={posts}
                                habits={habits}
                                isMy={isMyAcc}
                                refetch={refetchAcc}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}