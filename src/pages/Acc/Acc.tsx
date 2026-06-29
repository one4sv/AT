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

export default function Acc() {
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
    const { setDontHandle, dontHandleOther } = useSideMenu()
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(0);
    const [selector, setSelector] =
        useState<"sended" | "habits" | "posts">("sended");

    const touchStartY = useRef(0);
    const line = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const tabs:{tab:"sended" | "habits" | "posts", name:string, nameMy?:string}[] = [
        {tab:"sended", name:"Файлы", nameMy:"Избранное"},
        {tab:"habits", name:"Активности"},
        {tab:"posts", name:"Посты"},
    ]

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

    const handleScroll = () => {
        setDontHandle(true)
        if (!line.current || !contentRef.current) return
        const elScroll = contentRef.current.scrollLeft
        const elWidth = contentRef.current.clientWidth
        const proc = (elScroll / elWidth) * 100
        line.current.style.transform = `translateX(${proc}%)`
        if (proc > 150) setSelector("posts")
        else if (proc > 50) setSelector("habits")
        else setSelector("sended")
    }

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        setDontHandle(true)
        const scrollTop = e.currentTarget.scrollTop;

        if (e.deltaY > 0) setCollapsed(1);
        if (e.deltaY < 0 && scrollTop === 0) setCollapsed(0);
    }

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setDontHandle(true)
        if (dontHandleOther) return
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        setDontHandle(true)
        console.log(dontHandleOther)
        if (dontHandleOther) return
        const currentY = e.touches[0].clientY;
        const delta = touchStartY.current - currentY;
        const scrollTop = e.currentTarget.scrollTop;

        setCollapsed(prev => {
            if (delta < 0 && scrollTop > 0) {
                return prev;
            }

            const next = prev + delta * 0.01;
            return Math.max(0, Math.min(1, next));
        });

        touchStartY.current = currentY;
    };

    const handleTouchEnd = () => {
        setDontHandle(false)
        setCollapsed(prev => prev > 0.5 ? 1 : 0);
    };

    if (loading) return <Loader />;

    return (
        <div className="accDiv">
            <div className="acc">
                <AccInfo acc={acc} canView={canView} collapsed={collapsed}/>
                <div className="accContentSelector">
                    <div className="accContentSelect">
                        {tabs.map((tab, i) => (
                            <div
                                key={tab.name}
                                className={`accContentButt ${selector === tab.tab && "acbActive"}`}
                                onClick={() => contentRef.current && contentRef.current.scrollTo({
                                    left:contentRef.current.clientWidth * i,
                                    behavior:"smooth",
                                })}
                            >
                                {tab.nameMy && isMyAcc ? tab.nameMy : tab.name}
                            </div>
                        ))}
                    </div>
                    <div className="accContentLine">
                        <div className="accContentLineIndicator" ref={line}/>
                    </div>
                </div>

                <div className="accContent" ref={contentRef} onScroll={() => handleScroll()} onScrollEnd={() => setDontHandle(false)}>
                    <div className="accSlide">
                        <div
                            className="accContentSlide accMedia"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onWheel={handleWheel}
                            onTouchEnd={handleTouchEnd}
                        >
                            {!isMyAcc && <AccMedia media={media} />}
                        </div>
                    </div>
                    <div className="accSlide">
                        <div
                            className="accContentSlide"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onWheel={handleWheel}
                            onTouchEnd={handleTouchEnd}
                        >
                            <AccHabits
                                isMyAcc={isMyAcc}
                                habits={habits}
                                canView={canView}
                            />
                        </div>
                    </div>
                    <div className="accSlide">
                        <div
                            className="accContentSlide"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onWheel={handleWheel}
                            onTouchEnd={handleTouchEnd}
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