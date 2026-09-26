import { CaretDoubleDown, Prohibit } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { useChat } from "../../../components/hooks/ChatHook";
import EmojiBar from "../../../components/ts/utils/EmojiBar";
import ChatTextArea from "./ChatTa/ChatTextArea";
import type { activeHeaderType, message } from "../../../components/context/ChatContext";
import ChatSearch from "./ChatTa/ChatSearch";
import { useChatMessageScroll } from "../../../components/hooks/utils/useChatMessageScroll";
import ChatPinned from "./ChatTa/ChatPinned";
import PmsList from "./ChatTa/PmsList";
import SearchList from "./ChatTa/SearchList";
import ChatChoosingMess from "./ChatTa/ChatChoosingMess";

interface ChatTAProps {
    showGoDown:boolean, 
    handleGoDown:()=> void, 
    textAreaRef: React.RefObject<HTMLTextAreaElement | null>, 
    mess:string,
    setMess:React.Dispatch<SetStateAction<string>>,
    activeHeader: activeHeaderType,
    searchedMessages:message[]
}
export function ChatTAWrapper({ showGoDown, handleGoDown, textAreaRef, mess, setMess, activeHeader, searchedMessages } : ChatTAProps) {
    const { scrollToMessage } = useChatMessageScroll()
    const { chatWith, searchMess } = useChat()

    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false)
    const [ isSearchOpen, setIsSearchOpen ] = useState(false);
    const [ selectedIndex, setSelectedIndex ] = useState(0)
    const searchDivRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);
    const emojiButtRef = useRef<HTMLDivElement | null>(null)
    const chatTARef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        setIsSearchOpen(searchMess.trim().length > 0 && activeHeader === "search");
    }, [activeHeader, searchMess, searchedMessages]);

    const renderChatTa = () => {
        switch (activeHeader) {
            case "text":
                if (chatWith && (chatWith.am_i_blocked || chatWith.is_blocked)) {
                    return (
                        <div className="chatIsBlocked">
                            <Prohibit/>
                            {chatWith.am_i_blocked ? <span>Данный пользователь заблокировал вас</span> : <span>Вы заблокировали данного пользователя</span>}
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
            case "search":
                return (
                    <ChatSearch searchedMessages={searchedMessages} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} isOpen={isSearchOpen} setIsOpen={setIsSearchOpen}/>
                )            
            case "pinned":
                return (
                    <ChatPinned/>
                )
            case "choosing":
                return (
                    <ChatChoosingMess/>
                )
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchDivRef.current &&
                !searchDivRef.current.contains(e.target as Node) &&
                searchRef.current &&
                !searchRef.current.contains(e.target as Node)
            ) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="chatTAWrapper" ref={chatTARef}>
            {activeHeader === "search" ? <SearchList isOpen={isSearchOpen} searchDivRef={searchDivRef} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} searchedMessages={searchedMessages}/>: ""}
            {activeHeader === "pinned" ? <PmsList/> : ""}
            {activeHeader === "text" ? <EmojiBar setText={setMess} setShowEmojiBar={setShowEmojiBar} taRef={textAreaRef} showEmojiBar={showEmojiBar} emojiRef={emojiButtRef}/> : ""}
            {showGoDown && (
                <div className="goDown" onClick={handleGoDown}>
                    <CaretDoubleDown />
                </div>
            )}
            {renderChatTa()}
        </div>
    )
}