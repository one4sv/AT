import { usePinnedMessages } from "../../../../components/hooks/PinnedMessagesHook"
import UserInChatUserList from "../UserInChatUserList"

export default function PmsList() {
    const {
        pms,
        showList,
        listRef,
        setShowList,
        mouseUp,
        scrollToPin,
    } = usePinnedMessages()
    
    return (
        <div className={`pmsList ${showList ? "open" : "close"}`} ref={listRef} onMouseUp={mouseUp}>
            {pms.map((pm, i) => (
                <div className="pm" key={pm.id} onClick={() => scrollToPin(pm, i)} onMouseUp={() => {
                    scrollToPin(pm, i)
                    setShowList(false)
                    mouseUp()
                }}
                >
                    <UserInChatUserList m={pm}/>
                </div>
            ))}
        </div>
    )
}