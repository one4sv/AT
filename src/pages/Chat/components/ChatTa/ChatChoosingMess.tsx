import { useMessages } from "../../../../components/hooks/MessagesHook"
import { useChat } from "../../../../components/hooks/ChatHook"
import { CopySimpleIcon, ShareFatIcon, TrashIcon } from "@phosphor-icons/react"
import { useBlackout } from "../../../../components/hooks/BlackoutHook"
import { useDelete } from "../../../../components/hooks/DeleteHook"

export default function ChatChoosingMess() {
    const { chosenMess, setChosenMess, setRedirect } = useMessages()
    const { setActiveHeader, messages } = useChat() 
    const { setBlackout } = useBlackout()
    const { setDeleteConfirm, setDeleteMess} = useDelete()

    return (
        <>
            <div className="choosingMessActions">
                <div className="choosingCount" 
                    onClick={() => {
                        setActiveHeader("text")
                        setChosenMess([])
                    }}
                >
                    Выбрано: {chosenMess.length} сообщений
                </div>
                <div className="ChosenCountButt" onClick={() => {
                    if (chosenMess.length === 0) return 
                        const result = chosenMess
                            .sort((a,b) => a.id - b.id)
                            .map(m => m.text)
                            .join("\n")
                        navigator.clipboard.writeText(result)
                }}>
                    <CopySimpleIcon size={21}/>
                </div>
                <div className="ChosenCountButt" onClick={() =>  {
                    setRedirect(messages.filter(m => chosenMess.some(cm => cm.id === m.id)))
                    setBlackout({seted:true, module:"Redirecting"})
                }}>
                    <ShareFatIcon size={21}/>
                </div>
                <div className="ChosenCountButt delete" onClick={() => {
                    if (chosenMess.length === 0) return
                    setDeleteConfirm({goal:"mess", id:"", name:"сообщений"})
                    setDeleteMess(chosenMess.map((m) => m.id))
                    setBlackout({seted:true, module:"Delete"})
                }}>
                    <TrashIcon size={21}/>
                </div>
            </div>
        </>
    )
}
                