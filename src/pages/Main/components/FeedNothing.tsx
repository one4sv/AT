import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useNote } from "../../../components/hooks/NoteHook";
import { GhostIcon } from "@phosphor-icons/react";
import { useContacts } from "../../../components/hooks/ContactsHook";

export default function FeedNothing() {
    const { showNotification } = useNote()
    const { setBlackout } = useBlackout()
    const { mainSearchRef } = useContacts()
    const LINK = import.meta.env.VITE_LINK

    const copyLink = () => {
        navigator.clipboard.writeText(`${LINK}`)
        showNotification("success", "Ссылка скопирована")
    }
    return (
        <div className="feedNothing">
            <span className="feedNothingTitle">
                <GhostIcon size={50} strokeWidth={1.5} />Упс! А здесь ничего нет!
            </span>
            <span className="feedNothingInstr">
                Чтобы что-то появилось попробуйте:
            </span>
            <div className="feedNothingAdvices">
                <span className="feedNothingAdvice">1. <a onClick={() => mainSearchRef.current?.focus()}>Найти друзей</a> в AchieveTogether и начать общаться</span>
                <span className="feedNothingAdvice">2. <a onClick={() => setBlackout({seted:true, module:"AddHabit"})}>Создать первую активность</a>, начать можно с малого</span>
                <span className="feedNothingAdvice">3. <a onClick={() => copyLink()}>Пригласите друзей в Achieve Together</a>, вместе веселей</span>
            </div>
        </div>   
    )
}