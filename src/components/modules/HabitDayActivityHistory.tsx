import { XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useCalendar } from "../hooks/CalendarHook";
import SharedDayComments from "../../pages/HabitPage/components/Habit/Comment/SharedDayComments";
import "../../pages/HabitPage/scss/HabitChatMenu.scss";
import "../../pages/HabitPage/scss/DayComment.scss";

export default function HabitDayActivityHistory() {
    const { setBlackout } = useBlackout();
    const { chosenDay } = useCalendar();
    const [year, month, day] = chosenDay.split("-");

    return <div className="habitCollaborationModal habitDayActivityModal" role="dialog" aria-modal="true" aria-label="История активности за день">
        <div className="habitCollaborationHeader">
            <span>Действия за {day}.{month}.{year}</span>
            <button type="button" aria-label="Закрыть" onClick={() => setBlackout({ seted: false })}>
                <XIcon />
            </button>
        </div>
        <SharedDayComments expanded />
    </div>;
}
