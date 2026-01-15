import { X } from "@phosphor-icons/react";
import { useMessages } from "../../../components/hooks/MessagesHook";

export function MessBarBlock({ object, scrollToMessage }: { 
    object: { id: string, sender?: string, previewText:string },
    scrollToMessage: (id: number) => void
}) {
    const { setAnswer, setRedacting } = useMessages();
    const isAnswer = object.sender !== undefined;

    return (
        <div className="answerDiv">
            <div className="answer" onClick={() => scrollToMessage(Number(object.id))}>
                <div className="answer1str">
                    <span>{isAnswer ? "Ответ:" : "Редактировать:"} </span>
                    {object.sender}
                </div>
                <div className="answer2str">
                    {object.previewText}
                </div>
            </div>
            <div className="closeAnswer" 
                 onClick={() => { setAnswer(null); setRedacting(null); }}>
                <X />
            </div>
        </div>
    );
}
