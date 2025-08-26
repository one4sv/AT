import { useUser } from "../components/hooks/UserHook";
import Loader from "../components/ts/Loader.tsx";
import { useNote } from "../components/hooks/NoteHook.ts";
import { Ghost, Search } from "lucide-react";
import "../scss/Main.scss"

export default function Feed() {
    const { showNotification } = useNote()

    const copyLink = () => {
        navigator.clipboard.writeText("http://localhost:5173")
        showNotification("success", "Ссылка скопирована")
    }
    const { initialLoading } = useUser();

    if (initialLoading) return <Loader />;

    return (
        <div className="feedCentral">
            <div className="feedNothing">
                <span className="feedNothingTitle">
                    <Ghost size={50} strokeWidth={1.5} />Упс! А здесь ничего нет!
                </span>
                <span className="feedNothingInstr">
                    Чтобы что-то появилось попробуйте:
                </span>
                <div className="feedNothingAdvices">
                    <span className="feedNothingAdvice">1. Найти друзей в AchieveTogether и начать общаться</span>
                    <div className="inpfeedNothingWrapper">
                        <input type="text" placeholder="Nickname или имя" />
                        <Search strokeWidth={1.5} />
                    </div>
                    <span className="feedNothingAdvice">2. <a>Завести первую привычку или цель</a> начать можно с малого</span>
                    <span className="feedNothingAdvice">3. <a onClick={() => copyLink()}>Пригласите друзей в Achieve Together</a> вместе веселей</span>
                </div>
            </div>
        </div>
    );
}
