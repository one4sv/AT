import { ChatTeardropIcon, CheckCircle, Circle, MagnifyingGlassIcon, PushPinIcon, UserIcon } from "@phosphor-icons/react"
import "../../scss/modules/ChatWithInfo.scss"
import "../../pages/Acc/scss/Acc.scss"
import { useBlackout } from "../hooks/BlackoutHook"
import { useChat } from "../hooks/ChatHook"
import { isMobile } from "react-device-detect"
import { useMessages } from "../hooks/MessagesHook"
import { useNavigate } from "react-router"
import ChatMedia from "./components/ChatMedia"

export default function ChatWithInfo() {
    const { chatWith, activeHeader:header, setActiveHeader:setHeader, messages } = useChat()
    const { setBlackout } = useBlackout()
    const { setChosenMess } = useMessages();

    const navigate = useNavigate()

    if (chatWith === null) return

    return (
        <div className="chatWithInfoDiv">
            <div className="accInfoMain chatWithInfoMain" onClick={() => {                    
                if (chatWith.is_group) navigate(`/room/${chatWith.id}`)
                else navigate(`/acc/${chatWith.nick}`)
                setBlackout({seted:false})
            }}>
                <div
                    className="accPic"
                >
                    {chatWith?.avatar_url ? (
                        <img src={chatWith.avatar_url} alt="avatar" className="avatarImg" />
                    ) : (
                        <UserIcon size={128} />
                    )}
                </div>
                <div className="accInfoNames">
                    <div className="accMainInfoStr">
                        <div className="accInput nameInput">{chatWith?.name}</div>
                    </div>
                    <div className="accNickStr">
                        {!isMobile && "@"}
                        <div className="accInput nickInput">{chatWith?.nick}</div>
                    </div>
                </div>
            </div>
            <div className="settingInnerList">
                <div
                    className="settingInnerButt"
                    onClick={() => {
                        if (header === "search") setHeader("text")
                        else setHeader("search")
                        setBlackout({seted:false})
                    }}
                >
                    {header === "search" ? <ChatTeardropIcon weight="fill" /> : <MagnifyingGlassIcon />}
                    {header === "search" ? "Сообщение" : "Поиск сообщений"}
                </div>            
                {messages.find(m => m.is_pinned) ? (
                    <div
                        className="settingInnerButt"
                        onClick={() => {
                            if (header === "pinned") setHeader("text")
                            else setHeader("pinned")
                            setBlackout({seted:false})
                        }}
                    >
                        {header === "pinned" ? <ChatTeardropIcon weight="fill" /> : <PushPinIcon weight="fill"/>}
                        {header === "pinned" ? "Сообщение" : `${messages.filter(m => m.is_pinned).length} Закреплённые`}
                    </div>
                ) : ""}
                <div
                    className="settingInnerButt"
                    onClick={() => {
                        if (header === "choosing") setHeader("text")
                        else setHeader("choosing");
                        setChosenMess([]);
                        setBlackout({seted:false})
                    }}
                >
                    {header === "choosing" ? <Circle /> : <CheckCircle />}
                    {header === "choosing" ? "Отменить выбор" : "Выбрать сообщения"}
                </div>
            </div>
            <ChatMedia/>
        </div>
    )
}