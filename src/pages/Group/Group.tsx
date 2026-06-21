import { isMobile } from "react-device-detect";
import GroupInfo from "./components/GroupInfo";
import { useGroup } from "../../components/hooks/GroupHook";
import AccHabits from "../Acc/components/AccHabits";
import AccMedia from "../Acc/components/AccMedia";
import { useEffect, useRef, useState } from "react";
import GroupMembers from "./components/GroupMembers";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import Loader from "../../components/ts/Loader";
import "./scss/Group.scss";

export default function Group() {
    const { group, media, members, habits, refetchGroupWLoading, groupLoading, myPerms  } = useGroup();
    const { setTitle } = usePageTitle()
    const { id } = useParams<{id:string}>()
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(0);
    const [selector, setSelector] =
            useState<"sended" | "habits" | "members">("sended");

    const tabs:{tab:"sended" | "habits" | "members", name:string}[] = [
        {tab:"sended", name:"Файлы",},
        {tab:"habits", name:"Активности"},
        {tab:"members", name:"Участники"},
    ]
    const touchStartY = useRef(0);
    const line = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!id) {
            navigate(`/`, { replace: true });
            return;
        }
        refetchGroupWLoading(id);
    }, [navigate, id, group.id, refetchGroupWLoading]);

    useEffect(() => {
        if (group && !groupLoading && String(group.id) === id) {
            setTitle(group.name)
        }
    }, [group, groupLoading, id, setTitle]);

    const handleScroll = () => {
        if (!line.current || !contentRef.current) return
        const elScroll = contentRef.current.scrollLeft
        const elWidth = contentRef.current.clientWidth
        const proc = (elScroll / elWidth) * 100
        line.current.style.transform = `translateX(${proc}%)`

        if (proc > 150) setSelector("members")
        else if (proc > 50) setSelector("habits")
        else setSelector("sended")
    }

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;

        if (e.deltaY > 0) setCollapsed(1);
        if (e.deltaY < 0 && scrollTop === 0) setCollapsed(0);
    }

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const currentY = e.touches[0].clientY;
        const delta = touchStartY.current - currentY;
        const scrollTop = e.currentTarget.scrollTop;

        setCollapsed(prev => {
            if (delta < 0 && scrollTop > 0) {
                return prev;
            }

            const next = prev + delta * 0.01;
            console.log(next)
            return Math.max(0, Math.min(1, next));
        });

        touchStartY.current = currentY;
    };

    const handleTouchEnd = () => {
        setCollapsed(prev => prev > 0.5 ? 1 : 0);
    };

    if (groupLoading) return <Loader/>;

    return (
        <div className={`accDiv ${isMobile ? "mobile" : ""}`}>
            <div className="acc">

                <GroupInfo group={group} collapsed={collapsed}/>
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
                                    {tab.name}
                                </div>
                            ))}
                        </div>
                        <div className="accContentLine">
                            <div className="accContentLineIndicator" ref={line}/>
                        </div>
                    </div>

                <div className="accContent" ref={contentRef} onScroll={() => handleScroll()}>
                    <div className="accSlide">
                        <div
                            className="accContentSlide accMedia"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onWheel={handleWheel}
                            onTouchEnd={handleTouchEnd}
                        >
                            <AccMedia media={media} />
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
                                habits={habits}
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
                            <GroupMembers members={members} myPerms={myPerms}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}