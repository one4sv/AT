import { isMobile } from "react-device-detect";
import type { Habit } from "../../../components/context/HabitsContext";
import type { PrivateSettings } from "../../../components/context/SettingsContext";
import HabitDiv from "../../../components/ts/Habit";

interface acchabitsProps {
    habits?:Habit[],
    canView:(field: keyof PrivateSettings) => boolean,
    isMyAcc:boolean,
}
export default function AccHabits({habits, canView, isMyAcc}:acchabitsProps) {
    return (
        <div className="accHabits">
            <div className="accHabitsInfo">
                <div className="accHabitChart"></div>
                <div className="accHabitOverall"></div>
            </div>
            <div className={`accHabitsList ${isMobile ? "mobile" : ""}`}>
                {!canView("habits") ? (
                    <span className="accNoPrivateAccess">Пользователь скрыл привычки</span>
                ) : (
                    habits?.map((habit: Habit) => <HabitDiv key={habit.id} habit={habit} isMyAcc={isMyAcc} />)
                )}
            </div>
        </div>
    )
}