import { isMobile } from "react-device-detect";
import GroupInfo from "./components/GroupInfo";
import { useGroup } from "../../components/hooks/GroupHook";
import AccHabits from "../Acc/components/AccHabits";
import AccMedia from "../Acc/components/AccMedia";
import { useEffect, useState } from "react";
import GroupMembers from "./components/GroupMembers";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import Loader from "../../components/ts/Loader";
import "./scss/Group.scss";

export default function Group() {
    const { group, media, members, habits, refetchGroup, groupLoading  } = useGroup();
    const { setTitle } = usePageTitle()
    const { id } = useParams()
    const [ selector, setSelector ] = useState<string>("sended");
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!id) {
            navigate(`/`, { replace: true });
            return;
        }
        refetchGroup(id);
    }, [navigate, id, group?.id, refetchGroup]);

    useEffect(() => {
        if (group && !groupLoading && group.id === id) {
            setTitle(group.name)
        }
    }, [group, groupLoading, id, setTitle]);

    console.log(group);
    if (groupLoading) return <Loader/>;

    return (
        <div className={`groupDiv ${isMobile ? "mobile" : ""}`}>
            <GroupInfo group={group}/>
            <div className="accContentSelector">
                <div
                    className={`accContentSelect ${
                        selector === 'sended' ? 'sendedActive' :
                        selector === 'habits' ? 'habitsActive' :
                        'membersActive'
                    }`}
                >
                    {["sended", "habits", "posts"].map((sel) => {
                        return (
                            <div
                                key={sel}
                                className={`accContentButt ${selector === sel ? sel + "Active active" : ""}`}
                                onClick={() => setSelector(sel)}
                            >
                                {sel === "sended" ? "Отправленное" : sel === "habits" ? `Участники: ${members.length}` : "Привычки"}
                            </div>
                        )
                    })}
                </div>
                <div className="accContentLine">
                    <div className={`${selector}Line`}></div>
                </div>
            </div>

            <div className="accContent">
                {selector === "sended" && (
                    <AccMedia media={media}/>
                )}
                {selector === "habits" && (
                    <GroupMembers members={members}/>
                )}
                {selector === "posts" && (
                    <AccHabits habits={habits}/>
                )}
            </div>
        </div>
    )
}