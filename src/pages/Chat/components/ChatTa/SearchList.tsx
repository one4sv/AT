import { useTranslation } from "react-i18next";
import { useRef, type RefObject, type SetStateAction } from "react";
import UserInChatUserList from "../UserInChatUserList";
import { useChatMessageScroll } from "../../../../components/hooks/utils/useChatMessageScroll";
import type { message } from "../../../../components/context/ChatContext";

export default function SearchList ({isOpen, searchDivRef, selectedIndex, setSelectedIndex, searchedMessages}:{isOpen:boolean, searchDivRef:RefObject<HTMLDivElement | null>, selectedIndex:number, setSelectedIndex: React.Dispatch<SetStateAction<number>>, searchedMessages:message[]}) {
    const { t } = useTranslation("common");
    const searchItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const { scrollToMessage } = useChatMessageScroll()
    return (
        <div
            ref={searchDivRef}
            className={`chatSearchDiv ${isOpen ? "open" : "closed"}`}
        >
            <div className="searchCount">{t("chatUi.results", { count: searchedMessages.length })}</div>
            <div className="chatSearchList">
                {searchedMessages.map((m, i) => {
                    return (
                        <div
                            key={m.id}
                            className={`chatSearchItem ${selectedIndex === i ? "active" : ""}`}
                            onClick={() => { setSelectedIndex(i); scrollToMessage(m.id); }}
                            ref={(el) => { searchItemRefs.current.set(m.id, el) }}
                        >
                            <UserInChatUserList m={m}/>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}