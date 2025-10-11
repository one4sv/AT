import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../components/hooks/UserHook";
import { Camera, UserRound } from "lucide-react";
import "../scss/Acc.scss"
import axios from "axios";
import type { User } from "../components/context/UserContext";
import type { Habit } from "../components/context/HabitsContext";
import { useNote } from "../components/hooks/NoteHook";
import Loader from "../components/ts/Loader";
import HabitDiv from "../components/ts/Habit";
import type { PrivateSettings } from "../components/context/SettingsContext";
import { useUpUser } from "../components/hooks/UpdateUserHook";
import { useBlackout } from "../components/hooks/BlackoutHook";


export default function Acc() {
    const { setBlackout } = useBlackout()
    const { user } = useUser()
    const { showNotification } = useNote()
    const { newName, setNewName, newNick, setNewNick, newBio, setNewBio, newMail, setNewMail, newPick, handleSave } = useUpUser()
    const { contactId } = useParams()
    const navigate = useNavigate()

    const [ isMyAcc, setIsMyAcc ] = useState<boolean>(false)
    const [ acc, setAcc ] = useState<User>()
    const [ habits, setHabits ] = useState<Habit[]>()
    const [ loading, setLoading ] = useState<boolean>(true)
    const [ selector, setSelector ] = useState<string>("sended")
    const [ red, setRed ] = useState<boolean>(false)
    const [ privateRules, setPrivateRules] = useState<PrivateSettings>({number: "", mail:"", habits:"", posts:""})
    const [ previewUrl, setPreviewUrl ] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const refetchAcc = async() => {
        try {
            setLoading(true)
            const res = await axios.get(`http://localhost:3001/acc/${contactId}`, {withCredentials:true})
            if (res.data.success) {
                setAcc(res.data.acc)
                setHabits(res.data.habits)
                setPrivateRules(res.data.privateRules)
            }
        } catch {
            showNotification("error", "Не удалось найти пользователя")
        }
        finally {setLoading(false)}
    }

    useEffect(() => {
        if (!contactId) navigate("/")
        if (contactId === user.id) setIsMyAcc(true)
        refetchAcc()
    }, [contactId, user.id])

    const accInfoButt = () => {
        if (isMyAcc) setRed(!red)
        else navigate(`/chat/${acc?.id}`)
        if (red) handleSave()
    }

    useEffect(() => {
        if (newPick) {
            const url = URL.createObjectURL(newPick)
            setPreviewUrl(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setPreviewUrl(null)
        }
    }, [newPick])
    if (loading) return <Loader />

    return (
        <div className="accDiv">
            <div className="accInfo">
                <div className="accPic" onClick={() => isMyAcc && red && fileInputRef.current?.click()}>
                    <input type="file" className="accPicksfileInput" accept="image/*" maxLength={1} ref={fileInputRef} onChange={(e) => {
                        if (!e.target.files) return
                        setBlackout({seted:true, module:"PickHandler", pick:e.target.files[0]})
                    }}/>
                    {previewUrl ? (
                        <img src={previewUrl} alt="avatar preview" className="avatarImg"/>
                    ) : acc?.avatar_url ? (
                        <img src={acc.avatar_url} alt="avatar" className="avatarImg"/>
                    ) : red ? (
                        <Camera size={256}/>
                    ) : (
                        <UserRound size={128}/>
                    )}
                </div>
                <div className="accInfoNames">
                    <div>
                        <input id="name" className="accInput nameInput" value={(isMyAcc ? newName : acc?.username) ?? undefined} readOnly={!red} onChange={(e) => setNewName(e.currentTarget.value)}/>
                    </div>
                    <div>
                        @<input id="name" className="accInput nickInput" value={(isMyAcc ? newNick : acc?.nick) ?? undefined} readOnly={!red} onChange={(e) => setNewNick(e.currentTarget.value)}/>
                    </div>
                </div>
                <div className="accInfoWrapper">
                    <div className="accInfoRedButt" onClick={() => accInfoButt()}>
                        {isMyAcc ? (red ? "Сохранить " : "Редактировать профиль") : "Написать сообщение"}
                    </div>
                </div>
            </div>
            <div className="accExtraInfoWrapper" style={{display: acc?.bio || red ? "flex" : "none"}}>
                <label htmlFor="bioTA">Статус</label>
                <textarea className="bioTA extraInfoInput" id="bioTA" value={(isMyAcc ? newBio : acc?.bio) ?? undefined} readOnly={!red} onChange={(e) => setNewBio(e.currentTarget.value)}></textarea>
            </div>
            <div className="accExtraInfo">
                <div className="accExtraInfoWrapper">
                    {privateRules.number === "nobody" && !isMyAcc ? (
                        <span>Пользователь скрыл номер телефона</span>
                    ) : (
                        <>
                            <label htmlFor="numTA">Телефон</label>
                            <input className="numTA extraInfoInput" id="numTA" value="89083026130" readOnly={!red}/>
                        </>
                    )}
                </div>            
                <div className="accExtraInfoWrapper">
                    {privateRules.mail === "nobody" && !isMyAcc ? (
                        <span>Пользователь скрыл электронную почту</span>
                    ): (
                        <>
                            <label htmlFor="mailTA">email</label>
                            <input className="mailTA extraInfoInput" id="mailTA" value={(isMyAcc ? newMail : acc?.mail) ?? undefined} readOnly={!red} onChange={(e) => setNewMail(e.currentTarget.value)}/>
                        </>
                    )}
                </div>
            </div>
            <div className="accContentSelector">
                <div className="accContentSelect">
                    <div className={`accContentButt ${selector === "sended" ? selector+"Active active" : ""}`} onClick={()=>setSelector("sended")}>
                        Отправленное
                    </div>
                    <div className={`accContentButt ${selector === "habits" ? selector+"Active active" : ""}`} onClick={()=>setSelector("habits")}>
                        Привычки
                    </div>
                    <div className={`accContentButt ${selector === "posts" ? selector+"Active active" : ""}`} onClick={()=>setSelector("posts")}>
                        Посты
                    </div>
                </div>
                <div className="accContentLine">
                    <div className={`${selector}Line`}></div>
                </div>
            </div>
            <div className="accContent">
                {selector ==="habits" && (
                    <div className="accHabits">
                        <div className="accHabitsInfo">
                            <div className="accHabitChart">

                            </div>
                            <div className="accHabitOverall">

                            </div>
                        </div>
                        <div className="accHabitsList">
                            {privateRules.habits === "nobody" && !isMyAcc ? (
                                <span className="accNoPrivateAccess">
                                    Пользователь скрыл привычки
                                </span>
                            ) : (
                                habits?.map((habit) => (
                                    <HabitDiv key={habit.id} habit={habit} isMyAcc={isMyAcc}/>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}