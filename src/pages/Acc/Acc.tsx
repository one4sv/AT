import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Acc.scss";
import axios from "axios";
import type { User } from "../../components/context/UserContext";
import type { Habit } from "../../components/context/HabitsContext";
import { useNote } from "../../components/hooks/NoteHook";
import Loader from "../../components/ts/Loader";
import type { PrivateSettings } from "../../components/context/SettingsContext";
import { useUpUser } from "../../components/hooks/UpdateUserHook";
import AccInfo from "./components/AccInfo";
import AccHabits from "./components/AccHabits";
import AccPosts from "./components/AccPosts";
import type { Media } from "../../components/context/ChatContext";
import AccMedia from "./components/AccMedia";

export type Post = {
    id:number,
    user_id:string,
    media?:Media[];
    habit_id?:number,
    text:string,
    likes:string[]
}

export default function Acc() {
    const { user } = useUser();
    const { showNotification } = useNote();
    const { newBio, setNewBio, newMail, setNewMail } = useUpUser();
    const { contactId } = useParams();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL

    const [ isMyAcc, setIsMyAcc ] = useState<boolean>(false);
    const [ acc, setAcc ] = useState<User>();
    const [ habits, setHabits ] = useState<Habit[]>();
    const [ loading, setLoading ] = useState<boolean>(true);
    const [ selector, setSelector ] = useState<string>("sended");
    const [ red, setRed ] = useState<boolean>(false);
    const [ posts, setPosts ] = useState<Post[]>([])
    const [ media, setMedia ]  = useState<Media[]>([])
    const [privateRules, setPrivateRules] = useState<PrivateSettings>({ number: "", mail: "", habits: "", posts: "" });

    const canView = useCallback(
        (field: keyof PrivateSettings) => isMyAcc || privateRules[field] !== "nobody",
        [isMyAcc, privateRules]
    );

    const refetchAcc = useCallback(async () => {
        if (!contactId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}acc/${contactId}`, { withCredentials: true });
            if (res.data.success) {
                setAcc(res.data.acc);
                setHabits(res.data.habits);
                setPrivateRules(res.data.privateRules);
                setPosts(res.data.posts)
                setMedia(res.data.media)
            }
        } catch {
            showNotification("error", "Не удалось найти пользователя");
        } finally {
            setLoading(false);
        }
    }, [contactId, showNotification]);

    useEffect(() => {
        if (!contactId) navigate("/");
        const my = contactId === user.id
        setIsMyAcc(my);
        if (my) setSelector("habits")
        refetchAcc();
    }, [contactId, user.id, refetchAcc, navigate]);

    if (loading) return <Loader />;

    return (
        <div className="accDiv">
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

            <div className="accExtraInfo">
                <div className="accExtraInfoWrapper woutBg">
                    {!canView("number") ? (
                        <span>Пользователь скрыл номер телефона</span>
                    ) : (
                        <>
                            <label htmlFor="numTA">Телефон</label>
                            <input className="numTA extraInfoInput" id="numTA" value="89083026130" readOnly={!red} />
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
                {selector === "habits" && (
                    <AccHabits isMyAcc={isMyAcc} habits={habits} canView={canView}/>
                )}
                {selector === "posts" && (
                    <AccPosts posts={posts} habits={habits}/>
                )}
                {selector === "sended" && (
                    <AccMedia media={media}/>
                )}
            </div>
        </div>
    );
}