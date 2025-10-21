import { Ghost } from "lucide-react";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useNote } from "../../../components/hooks/NoteHook";

export default function FeedNothing() {
    const { showNotification } = useNote()
    const { setBlackout } = useBlackout()
    const LINK = import.meta.env.LINK

    const copyLink = () => {
        navigator.clipboard.writeText(`${LINK}`)
        showNotification("success", "Ссылка скопирована")
    }
    return (
        <div className="feedNothing">
            <span className="feedNothingTitle">
                <Ghost size={50} strokeWidth={1.5} />Упс! А здесь ничего нет!
            </span>
            <span className="feedNothingInstr">
                Чтобы что-то появилось попробуйте:
            </span>
            <div className="feedNothingAdvices">
                <span className="feedNothingAdvice">1. Найти друзей в AchieveTogether и начать общаться</span>
                <span className="feedNothingAdvice">2. <a onClick={() => setBlackout({seted:true, module:"AddHabit"})}>Завести первую привычку</a>, начать можно с малого</span>
                <span className="feedNothingAdvice">3. <a onClick={() => copyLink()}>Пригласите друзей в Achieve Together</a>, вместе веселей</span>
            </div>
        </div>   
    )
}