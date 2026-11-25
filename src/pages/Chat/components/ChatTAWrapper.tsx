import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { CaretDoubleDown, Prohibit } from "@phosphor-icons/react";
import { useRef, useState, type SetStateAction } from "react";
import { useChat } from "../../../components/hooks/ChatHook";
import EmojiBar from "../../../components/ts/utils/EmojiBar";
import ChatTextArea from "./ChatTa/ChatTextArea";
import { useChatMessageScroll } from "../../../components/hooks/utils/useChatMessageScroll";
import { ToggleBlocked } from "../../../components/ts/ContextMenu/buttons/ToggleBlocked";

interface ChatTAProps {
    showGoDown:boolean, 
    handleGoDown:()=> void, 
    textAreaRef: React.RefObject<HTMLTextAreaElement | null>, 
    mess:string,
    setMess:React.Dispatch<SetStateAction<string>>
}
export function ChatTAWrapper({ showGoDown, handleGoDown, textAreaRef, mess, setMess } : ChatTAProps) {
    const { t } = useTranslation("common");
    const { scrollToMessage } = useChatMessageScroll()
    const { chatWith } = useChat()

    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false)
    const emojiButtRef = useRef<HTMLDivElement | null>(null)

    const renderChatTa = () => {
                if (chatWith?.is_group && chatWith.can_send_messages === false) {
                    return <div className="chatIsBlocked"><Prohibit/><span>{t("chatUi.noSendPermission")}</span></div>;
                }
                if (chatWith?.deletion_pending) {
                    return <div className="chatIsBlocked"><Prohibit/><span>{t("chatUi.pendingDeletion")}</span></div>;
                }
                if (chatWith && (chatWith.am_i_blocked || chatWith.is_blocked)) {
                    return (
                        <div className="chatIsBlocked">
                            <Prohibit/>
                            <span>{t(chatWith.am_i_blocked ? "chatUi.blockedBy" : "chatUi.blockedYou")}</span>
                            {chatWith.is_blocked && !chatWith.am_i_blocked && <ToggleBlocked id={chatWith.id} nick={chatWith.nick} bool={true} className="chatUnblockButt"/>}
                        </div>
                    )
                } else return (
                    <ChatTextArea
                        scrollToMessage={scrollToMessage}
                        textAreaRef={textAreaRef}
                        mess={mess}
                        setMess={setMess}
                        showEmojiBar={showEmojiBar}
                        setShowEmojiBar={setShowEmojiBar}
                        emojiButtRef={emojiButtRef}
                    />
                )
    }

    return (
        <div className="chatTAWrapper">
            {!chatWith?.deletion_pending && !chatWith?.is_blocked && !chatWith?.am_i_blocked && chatWith?.can_send_messages !== false ? <EmojiBar setText={setMess} setShowEmojiBar={setShowEmojiBar} taRef={textAreaRef} showEmojiBar={showEmojiBar} emojiRef={emojiButtRef}/> : ""}
            <AnimatePresence mode="sync" initial={false}>
                <motion.div
                    key="composer"
                    className="chatComposerLayer"
                    initial={{ y: "300%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "300%" }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    {renderChatTa()}
                    {showGoDown && <button type="button" className="goDown" onClick={handleGoDown} aria-label={t("chatUi.goDown")}><CaretDoubleDown/></button>}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}