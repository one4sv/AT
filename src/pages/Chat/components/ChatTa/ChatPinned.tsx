import { List } from "@phosphor-icons/react"
import { usePinnedMessages } from "../../../../components/hooks/PinnedMessagesHook"
import { useUser } from "../../../../components/hooks/UserHook"

export default function ChatPinned() {
    const { user } = useUser()
    const {
        pms,
        currentpm,
        showNow,
        showList,
        longPressTriggered,
        setShowList,
        mouseDown,
        mouseUp,
        scrollToPin,
    } = usePinnedMessages()

    return (
        <>
            <div className="pmsMain">
                <div className="pmsShowNow" onClick={() => scrollToPin(currentpm, showNow)}>
                    <span className="pmsSender">
                        {currentpm?.sender_id === user.id ? "Вы" : currentpm?.sender_name || currentpm?.sender_nick}: 
                    </span>
                    &nbsp;
                    <span className="pmsText">
                        {currentpm?.content
                            ? currentpm?.content
                            : currentpm?.files && currentpm?.files.length > 0
                                ? `${currentpm.files?.length} mediafiles`
                                : "Пересланное сообщение"}
                    </span>
                </div>
                <div className="pmShowInfo" onMouseDown={mouseDown}
                    onMouseUp={mouseUp}
                    onClick={() => {
                    if (longPressTriggered.current) return
                        setShowList(!showList)
                    }}
                >
                    {showNow + 1}/{pms.length}
                    <div className="chatWriteTAButt">
                        <List className="chatSend"/>
                    </div>
                </div>
            </div>
        </>
    )
}