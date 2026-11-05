import { useTranslation } from "react-i18next";
import { XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useCalendar } from "../hooks/CalendarHook";
import SharedDayComments from "../../pages/HabitPage/components/Habit/Comment/SharedDayComments";
import "../../pages/HabitPage/scss/HabitChatMenu.scss";
import "../../pages/HabitPage/scss/DayComment.scss";

export default function HabitDayActivityHistory() {
    const { t } = useTranslation("common");
    const { setBlackout } = useBlackout();
    const { chosenDay } = useCalendar();
    const [year, month, day] = chosenDay.split("-");

    return <div className="habitCollaborationModal habitDayActivityModal" role="dialog" aria-modal="true" aria-label={t("habitDialog.dayHistory")}>
        <div className="habitCollaborationHeader">
            <span>{t("habitDialog.dayActions", { date: `${day}.${month}.${year}` })}</span>
            <button type="button" aria-label={t("habitDialog.close")} onClick={() => setBlackout({ seted: false })}>
                <XIcon />
            </button>
        </div>
        <SharedDayComments expanded />
    </div>;
}
