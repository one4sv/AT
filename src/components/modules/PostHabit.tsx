import { ArrowLeftIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useHabits } from "../hooks/HabitsHook";
import HabitDiv from "../ts/Habit";
import "../../scss/SM/habitsList.scss";
import "../../scss/modules/PostSettings.scss";

interface PostHabitProps {
    selected: string;
    onSelect: (value: string) => void;
    onBack: () => void;
}

export default function PostHabit({ selected, onSelect, onBack }: PostHabitProps) {
    const { t } = useTranslation("acc");
    const { habits, loadingHabits } = useHabits();

    return (
        <div
            className="postSettingsDiv settingInnerDiv"
            role="dialog"
            aria-modal="true"
            aria-labelledby="postHabitTitle"
        >
            <div className="postSettingsHeader">
                <div className="settingHeader" id="postHabitTitle">
                    {t("editor.habit")}
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    aria-label={t("navigation.back", { ns: "info" })}
                >
                    <ArrowLeftIcon />
                </button>
            </div>
            <div className="postHabitList">
                <button
                    type="button"
                    className={`habit postNoHabit ${selected === "none" ? "active" : ""}`}
                    aria-pressed={selected === "none"}
                    onClick={() => onSelect("none")}
                >
                    <div className="habitIcon">
                        <ProhibitIcon className="habitIconSvg" />
                    </div>
                    <div className="habitInfo">
                        <div className="habitName">{t("post.noHabit")}</div>
                    </div>
                </button>
                {loadingHabits && <div className="settingHint" role="status">
                    {t("post.loading")}
                </div>}
                {(habits || []).map(habit => (
                    <HabitDiv
                        key={habit.id}
                        habit={habit}
                        id={Number(selected)}
                        onSelect={item => onSelect(String(item.id))}
                    />
                ))}
            </div>
        </div>
    );
}
