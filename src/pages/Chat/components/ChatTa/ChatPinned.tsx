import { useTranslation } from "react-i18next";
import { List } from "@phosphor-icons/react"
import { usePinnedMessages } from "../../../../components/hooks/PinnedMessagesHook"
import { useUser } from "../../../../components/hooks/UserHook"

export default function ChatPinned() {
    const { t } = useTranslation("common");
    const { user } = useUser()
    const {
        pms,
        currentpm,
        showNow,
        showList,
        setShowList,
        advancePin,
    } = usePinnedMessages()

    return (
        <>
            <div className="pmsMain">
                <div className="pmsShowNow" onClick={advancePin}>
                    <span className="pmsSender">
                        {currentpm?.sender_id === user.id ? t("chatUi.you") : currentpm?.sender_name || currentpm?.sender_nick}: 
                    </span>
                    &nbsp;
                    <span className="pmsText">
                        {currentpm?.content
                            ? currentpm?.content
                            : currentpm?.files && currentpm?.files.length > 0
                                ? t("chatUi.mediaCount", { count: currentpm.files.length })
                                : t("chatUi.forwarded")}
                    </span>
                </div>
                <div className="pmShowInfo" onClick={() => setShowList(!showList)}>
                    {showNow + 1}/{pms.length}
                    <div className="chatWriteTAButt">
                        <List className="chatSend"/>
                    </div>
                </div>
            </div>
        </>
    )
}