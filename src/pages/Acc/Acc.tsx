import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Acc.scss";
import Loader from "../../components/ts/Loader";
import type { PrivateSettings } from "../../components/context/SettingsContext";
import { useUpUser } from "../../components/hooks/UpdateUserHook";
import AccInfo from "./components/AccInfo";
import AccHabits from "./components/AccHabits";
import AccPosts from "./components/AccPosts";
import AccMedia from "./components/AccMedia";
import { useAcc } from "../../components/hooks/AccHook";
import { isMobile } from "react-device-detect";
import { usePageTitle } from "../../components/hooks/PageContextHook";

export default function Acc() {
    const { user } = useUser();
    const { refetchAcc, loading, media, posts, habits, acc, privateRules, refetchPosts } = useAcc()
    const { newBio, setNewBio, newMail, setNewMail } = useUpUser();
    const { nick, id } = useParams();
    const { setTitle } = usePageTitle()

    const navigate = useNavigate();
    const [ selector, setSelector ] = useState<string>("sended");
    const [ isMyAcc, setIsMyAcc ] = useState<boolean>(false);
    const [ red, setRed ] = useState<boolean>(false);

    const canView = useCallback(
        (field: keyof PrivateSettings) => isMyAcc || privateRules[field] !== "nobody",
        [isMyAcc, privateRules]
    );

    useEffect(() => {
        if (!user?.id) return;
        if (!nick) {
            navigate(`/acc/${user.nick}`, { replace: true });
            return;
        }
        const my = nick === user.nick;
        setIsMyAcc(my);
        if (my) setSelector("habits");

        (async () => {
            await Promise.all([
                refetchAcc(nick),
                refetchPosts(nick)
            ]);
        })();
    }, [nick, user.id, refetchAcc, navigate, refetchPosts, user.nick, id]);

    useEffect(() => {
        if (acc && !loading && acc.nick === nick) {
            setTitle(acc.username || acc.nick);
        }
    }, [acc, loading]);


    if (loading) return <Loader />;

    return (
        <div className={`accDiv ${isMobile ? "mobile" : ""}`}>
            <AccInfo red={red} setRed={setRed} acc={acc} isMyAcc={isMyAcc}/>
            <div className="accExtraInfoWrapper" style={{ display: acc?.bio || red ? "flex" : "none" }}>
                <label htmlFor="bioTA">Статус</label>
                <textarea
                    className="bioTA extraInfoInput"
                    id="bioTA"
                    value={(isMyAcc ? newBio : acc?.bio) ?? ""}
                    readOnly={!red}
                    onChange={(e) => setNewBio(e.currentTarget.value)}
                ></textarea>
            </div>

            <div className={`accExtraInfo ${isMobile ? "mobile" :""}`}>
                <div className="accExtraInfoWrapper woutBg">
                    {!canView("number") ? (
                        <span>Пользователь скрыл номер телефона</span>
                    ) : (
                        <>
                            <label htmlFor="numTA">Телефон</label>
                            <input className="numTA extraInfoInput" id="numTA" value="Не реализовано" readOnly={!red} />
                        </>
                    )}
                </div>
                <div className="accExtraInfoWrapper woutBg">
                    {!canView("mail") ? (
                        <span>Пользователь скрыл электронную почту</span>
                    ) : (
                        <>
                            <label htmlFor="mailTA">email</label>
                            <input
                                className="mailTA extraInfoInput"
                                id="mailTA"
                                value={(isMyAcc ? newMail : acc?.mail) ?? ""}
                                readOnly={!red}
                                onChange={(e) => setNewMail(e.currentTarget.value)}
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="accContentSelector">
                <div
                    className={`accContentSelect ${
                        selector === 'sended' ? 'sendedActive' :
                        selector === 'habits' ? 'habitsActive' :
                        'postsActive'
                    } ${isMyAcc ? 'myAccCL' : ''}`}
                >
                    {["sended", "habits", "posts"].map((sel) => {
                        if (sel === "sended" && isMyAcc) return null
                        return (
                            <div
                                key={sel}
                                className={`accContentButt ${selector === sel ? sel + "Active active" : ""}`}
                                onClick={() => setSelector(sel)}
                            >
                                {sel === "sended" ? "Отправленное" : sel === "habits" ? "Привычки" : "Посты"}
                            </div>
                        )
                    })}
                </div>
                <div className="accContentLine">
                    <div className={`${selector}Line ${isMyAcc ? "myAccCL" : ""}`}></div>
                </div>
            </div>

            <div className="accContent">
                {selector === "sended" && (
                    <AccMedia media={media}/>
                )}
                {selector === "habits" && (
                    <AccHabits isMyAcc={isMyAcc} habits={habits} canView={canView}/>
                )}
                {selector === "posts" && (
                    <AccPosts posts={posts} habits={habits} isMy={isMyAcc} refetch={refetchAcc}/>
                )}
            </div>
        </div>
    );
}