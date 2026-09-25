export default function AnswerMess({answer, scrollToMessage} : { answer : {id: number, name: string, text: string}, scrollToMessage:(id:number) => void, }) {
    return (
        <div className="answerMess" onClick={() => scrollToMessage(answer.id)}>
            <div className="answerMess1str">
                {answer.name}
            </div>
            <div className="answerMess2str">
                {answer.text}
            </div>
        </div>
    )
}