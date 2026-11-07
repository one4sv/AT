import { isMobile } from "react-device-detect";
import type { Habit } from "../../../components/context/HabitsContext";
import type { PrivateSettings } from "../../../components/context/SettingsContext";
import HabitDiv from "../../../components/ts/Habit";
import { useTranslation } from "react-i18next";
import SectionArt from "../../../components/ts/SectionArt";

interface acchabitsProps {
    habits?:Habit[],
    canView?:(field: keyof PrivateSettings) => boolean,
    isMyAcc?:boolean,
}
export default function AccHabits({habits, canView, isMyAcc}:acchabitsProps) {
    const { t } = useTranslation("acc");
    const isPrivate = !!canView && !canView("habits");
    const isEmpty = isPrivate || !habits?.length;
    return (
        <div className="accHabits">
            <div className="accHabitsInfo">
                <div className="accHabitChart"></div>
                <div className="accHabitOverall"></div>
            </div>
            <div className={`accHabitsList ${isMobile ? "mobile" : ""} ${isEmpty ? "empty" : ""}`}>
                {isPrivate ? (
                    <div className="accEmptyState">
                        <SectionArt theme="privacy"/>
                        <span>{t("activitiesHidden")}</span>
                    </div>
                ) : habits?.length ? (
                    habits.map((habit: Habit) => <HabitDiv key={habit.id} habit={habit} isMyAcc={isMyAcc} />)
                ) : (
                    <div className="accEmptyState">
                        <SectionArt theme="habits"/>
                        <span>{t(isMyAcc ? "activitiesEmptyOwn" : "activitiesEmpty")}</span>
                    </div>
                )}
            </div>
        </div>
    )
}