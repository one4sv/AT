import { useState, useRef, useEffect } from "react"
import axios, { isAxiosError } from "axios"
import "../../scss/SM/sideMenu.scss"
import { CircleUserRound, Search, LogOut, House, ChartLine, Plus } from "lucide-react"
import HabitsList from "./SM/HabitsList.tsx"
import { useUser } from "../hooks/UserHook"
import { useNote } from "../hooks/NoteHook"
import { useBlackout } from "../hooks/BlackoutHook.ts"
import ContactsList from "./SM/ContactsList.tsx"
import { useNavigate } from "react-router"
import { useSettings } from "../hooks/SettingsHook.ts"
import { useChat } from "../hooks/ChatHook.ts"
import { useHabits } from "../hooks/HabitsHook.ts"
import MinLoader from "./MinLoader.tsx"
import { useLocation } from "react-router"
import { isMobile } from "react-device-detect"

export default function SideMenu() {
    const { setSearch, loadingList } = useChat()
    const { loadingHabits } = useHabits()
    const { user, refetchUser } = useUser()
    const { setTab } = useSettings()
    const { setBlackout } = useBlackout()
    const { showNotification } = useNote()
    const API_URL = import.meta.env.VITE_API_URL
    const location = useLocation()
    const navigate = useNavigate()

    const [ showList, setShowList ] = useState(false)
    const [ actieveTab, setActieveTab ] = useState<string>("message")
    const [ showPlusMenu, setShowPlusMenu ] = useState<boolean>(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const plusRef = useRef<HTMLDivElement>(null)
    const plusMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (location.pathname.includes("/habit")) setActieveTab("habits")
    },[location.pathname])

    const logOut = async () => {
        try {
            const res = await axios.get(`${API_URL}logout`, { withCredentials: true })
            if (res.data.success) {
                refetchUser()
            } else {
                showNotification("error", "Не удалось выйти")
            }
        } catch (error: unknown) {
            if (isAxiosError(error)) {
                showNotification("error", error.response?.data?.message || "Ошибка при выходе")
            } else {
                showNotification("error", "Что-то пошло не так")
            }
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setShowList(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                plusRef.current &&
                !plusRef.current.contains(event.target as Node) &&
                plusMenuRef.current &&
                !plusMenuRef.current.contains(event.target as Node)
            ) {
                setShowPlusMenu(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])


    return (
        <div className={`sideMenu ${isMobile ? "mobileSM" : ""}`}>
            <div className="SMsearchDiv">
                <div className="SMmenuWrapper">
                    <div
                        className={`SMmenuButt ${showList ? "active" : ""}`}
                        onClick={() => setShowList(!showList)}
                        ref={buttonRef}
                    >
                        {user?.avatar_url ? <img className="SMmenuAvatar" src={user.avatar_url} alt={(user.username ?? user.nick) || undefined} /> : <CircleUserRound />}
                    </div>
                    <div className={`SMprofileMenu ${showList ? "active" : ""} ${isMobile ? "mobile" : ""}`} ref={menuRef}>
                        <div className="SMprofileButt" onClick={() => {
                            setShowList(false)
                            navigate(`/acc/${user.nick}`)
                        }}>
                            {user.username || user.nick}
                        </div>
                        <div
                            className="SMprofileButt"
                            onClick={() => {
                                setShowList(false)
                                setTab("pers")
                                setBlackout({ seted: true, module: "Settings" })
                            }}
                        >
                            Настройки
                        </div>
                        <div className="SMprofileButt exit" onClick={logOut}>
                            Выйти <LogOut />
                        </div>
                    </div>
                </div>
                <div className="SMsearch">
                    <input type="text" className="SMsearchInput" onChange={(e) => setSearch(e.currentTarget.value)}/>
                    <Search />
                </div>
            </div>

            <div className="SMtabs">
                <div
                    className={`SMtab ${actieveTab === "message" ? "active" : ""}`}
                    onClick={() => setActieveTab("message")}
                >
                    Сообщения
                </div>
                <div
                    className={`SMtab ${actieveTab === "habits" ? "active habits" : ""}`}
                    onClick={() => setActieveTab("habits")}
                >
                    Активности
                </div>
            </div>
            <div className={`SMline ${actieveTab === "message" ? "mess" : "habits"}`} />

            <div className="ListWrapper">
                <div className="slider" style={{ transform: `translateX(${actieveTab === "message" ? 0 : -50}%)` }}>
                    <div className={`slide ${isMobile ? "mobileSlide" : ""}`}>
                        {loadingList ? (
                            <div className="menuLoader">
                                <MinLoader/>
                            </div>
                        ) : (
                            <ContactsList />
                        )}
                    </div>
                    <div className={`slide ${isMobile ? "mobileSlide" : ""}`}>
                        {loadingHabits ? (
                            <div className="menuLoader">
                                <MinLoader/>
                            </div>
                        ) : (
                            <HabitsList />
                        )}
                    </div>
                </div>
            </div>
            <div className="SMnavDiv">
                <div className={`plusMenu ${showPlusMenu ? "active" : ""}`} ref={plusMenuRef}>
                    <div className="plusMenuButt" onClick={() => setBlackout({seted:true, module:"AddHabit"})}>
                        Добавить активность
                    </div>
                    <div className="plusMenuButt">
                        Создать чат
                    </div>
                </div>
                <div className="SMnav">
                    <div className="SMnavButt" onClick={() => navigate("/")}>
                        <House />
                    </div>
                    <div className="SMnavButt" onClick={()=> setShowPlusMenu(!showPlusMenu)} ref={plusRef}>
                        <Plus />
                    </div>
                    <div className="SMnavButt" onClick={() => navigate("/habit")}>
                        <ChartLine />
                    </div>
                </div>
            </div>
        </div>
    )
}
