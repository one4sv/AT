import { useTranslation } from "react-i18next";
import { ChatTeardropIcon, CheckCircle, Circle, CircleIcon, MagnifyingGlassIcon, PushPinIcon, UserIcon } from "@phosphor-icons/react"
import "./scss/ChatWithInfo.scss"
import "../../pages/Acc/scss/AccInfo.scss"
import { useBlackout } from "../hooks/BlackoutHook"
import { useChat } from "../hooks/ChatHook"
import useContactAlias from "../hooks/utils/useContactAlias"
import useCompactLayout from "../hooks/utils/useCompactLayout"
import { useMessages } from "../hooks/MessagesHook"
import { useNavigate } from "react-router"
import ChatMedia from "./components/ChatMedia"
import { useContacts } from "../hooks/ContactsHook"
import formatLastOnline from "../ts/utils/formatOnline"

export default function ChatWithInfo() {
    const { t } = useTranslation("common");
    const isMobile = useCompactLayout();
    const { chatWith, activeHeader:header, setActiveHeader:setHeader, messages } = useChat()
    const [alias] = useContactAlias(chatWith?.is_group ? undefined : chatWith?.id);
    const { setBlackout } = useBlackout()
    const { setChosenMess } = useMessages();
    const { onlineMap } = useContacts();

    const navigate = useNavigate()

    if (chatWith === null) return

    const presence = !chatWith.is_group && <span className={`accOnlineStauts ${onlineMap[chatWith.id] ? "online" : "offline"}`}>
        <CircleIcon size={16} weight="fill" aria-hidden="true"/>
        {onlineMap[chatWith.id] ? t("online") : formatLastOnline(chatWith.last_online)}
    </span>;

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
                        <div className="accInput nameInput">{alias || chatWith?.name}</div>
                    </div>
                    <div className="accNickStr">
                        {!isMobile && "@"}
                        <div className="accInput nickInput">{chatWith?.nick}</div>
                    </div>
                    {presence}
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
                    {t(header === "search" ? "chatUi.message" : "chatUi.searchMessages")}
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
                        {header === "pinned" ? t("chatUi.message") : t("chatUi.pinnedCount", { count: messages.filter(m => m.is_pinned).length })}
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
                    {t(header === "choosing" ? "chatUi.cancelSelection" : "chatUi.selectMessages")}
                </div>
            </div>
            <ChatMedia/>
        </div>
    )
}