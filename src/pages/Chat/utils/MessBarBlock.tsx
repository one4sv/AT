import { X } from "@phosphor-icons/react";
import { useMessages } from "../../../components/hooks/MessagesHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";

export function MessBarBlock({ object, scrollToMessage }: { 
    object: { id: string, sender?: string, previewText:string },
    scrollToMessage: (id: number) => void
}) {
    const { answer, setAnswer, editing, setEditing, redirect, setRedirect, setIsChose, setChosenMess, showNames } = useMessages();
    const { setBlackout } = useBlackout() 
    const { messages } = useChat()
    const { openMenu } = useContextMenu()
    
    let barType = "";
    if (editing) barType = "Редактировать: ";
    else if (answer) barType = "Ответ: ";
    else if (redirect && showNames) barType = "Переслать от: ";
    else if (redirect && !showNames) barType = "Переслать от: ";

    return (
        <div className="answerDiv" onContextMenu={(e) => {
            if (redirect === undefined) return
            e.preventDefault()
            openMenu(e.clientX, e.clientY, "messBar", {id:""})
        }}>
            <div className="answer" onClick={() => {
                if (redirect === undefined ||
                    (redirect.length === 1
                        && messages.find(m => m.id === redirect[0].id)
                    )
                ) scrollToMessage(Number(object.id))
                else {
                    setIsChose(true)
                    setChosenMess(redirect.map(m => ({id:Number(m.id), text:m.content})))
                    setBlackout({seted:true, module:"RedirectMesses"})
                }
            }}>
                <div className="answer1str">
                    <span>{barType}</span>
                    {showNames && object.sender}
                </div>
                <div className="answer2str">
                    {object.previewText}
                </div>
            </div>
            <div className="closeAnswer" onClick={() => { 
                setAnswer(null)
                setEditing(null)
                setRedirect(undefined)
            }}>
                <X />
            </div>            
        </div>
    );
}
