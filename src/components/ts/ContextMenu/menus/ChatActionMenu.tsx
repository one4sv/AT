import { useTranslation } from "react-i18next";
import { PushPinIcon, MagnifyingGlassIcon, CheckCircle, EyeSlash } from "@phosphor-icons/react";
import { useChat } from "../../../hooks/ChatHook";
import { useMessages } from "../../../hooks/MessagesHook";
import { usePinnedMessages } from "../../../hooks/PinnedMessagesHook";
import type { activeHeaderType } from "../../../context/ChatContext";

export default function ChatActionMenu() {
    const {t}=useTranslation("common");
    const {setActiveHeader,setChatPanelHidden}=useChat();
    const {setChosenMess}=useMessages();
    const {pms}=usePinnedMessages();
    const select=(mode:activeHeaderType)=>{setChosenMess([]);setActiveHeader(mode);setChatPanelHidden(false);};
    return <>
        {!!pms.length && <div className="ContextMenuButt" onClick={()=>select("pinned")}><PushPinIcon/>{t("chatUi.pinnedPanel")}</div>}
        <div className="ContextMenuButt" onClick={()=>select("search")}><MagnifyingGlassIcon/>{t("chatUi.searchMessages")}</div>
        <div className="ContextMenuButt" onClick={()=>select("choosing")}><CheckCircle/>{t("chatUi.selectMessages")}</div>
        <div className="ContextMenuButt" onClick={()=>setChatPanelHidden(true)}><EyeSlash/>{t("chatUi.hidePanel")}</div>
    </>;
}
