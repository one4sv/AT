import { useState } from "react";
import { ArrowLeftIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useHabits } from "../hooks/HabitsHook";
import { useUser } from "../hooks/UserHook";
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
    const { t: settingsT } = useTranslation("settings");
    const { habits, loadingHabits } = useHabits();
    const { user } = useUser();
    const [ search, setSearch ] = useState("");
    const [ filter, setFilter ] = useState("all");

    const filtered = (habits || []).filter(habit =>
        habit.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (filter === "all" || (filter === "mine" ? habit.user_id === user.id :
            filter === "shared" ? habit.user_id !== user.id : habit.ongoing))
    );

    return (
        <div className="postSettingsDiv settingInnerDiv" role="dialog" aria-modal="true" aria-labelledby="postHabitTitle">
            <div className="postSettingsHeader">
                <div className="settingHeader" id="postHabitTitle">{t("editor.habit")}</div>
                <button type="button" onClick={onBack} aria-label={t("navigation.back", { ns: "info" })}>
                    <ArrowLeftIcon />
                </button>
            </div>
            <input className="postHabitSearch" type="search" value={search}
                onChange={e => setSearch(e.target.value)} placeholder={settingsT("quickFilters.search")}/>
            <div className="postHabitFilters">
                {(["all", "mine", "shared", "active"] as const).map(value => (
                    <button key={value} type="button" className={filter === value ? "active" : ""}
                        onClick={() => setFilter(value)}>{settingsT(`quickFilters.${value}`)}</button>
                ))}
            </div>
            <div className="postHabitList">
                <button type="button" className={`habit postNoHabit ${selected === "none" ? "active" : ""}`}
                    aria-pressed={selected === "none"} onClick={() => onSelect("none")}>
                    <div className="habitIcon"><ProhibitIcon className="habitIconSvg" /></div>
                    <div className="habitInfo"><div className="habitName">{t("post.noHabit")}</div></div>
                </button>
                {loadingHabits && <div className="settingHint" role="status">{t("post.loading")}</div>}
                {filtered.map(habit => (
                    <HabitDiv key={habit.id} habit={habit} id={Number(selected)}
                        onSelect={item => onSelect(String(item.id))}/>
                ))}
            </div>
        </div>
    );
}
