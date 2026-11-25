import { usePinnedMessages } from "../../../../components/hooks/PinnedMessagesHook"
import UserInChatUserList from "../UserInChatUserList"

export default function PmsList() {
    const {
        pms,
        showList,
        listRef,
        setShowList,
        scrollToPin,
    } = usePinnedMessages()
    
    return (
        <div className={`pmsList ${showList ? "open" : "close"}`} ref={listRef}>
            {pms.map((pm, i) => (
                <div className="pm" key={pm.id} onClick={() => { scrollToPin(pm, i); setShowList(false); }}
                >
                    <UserInChatUserList m={pm}/>
                </div>
            ))}
        </div>
    )
}