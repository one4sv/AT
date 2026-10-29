import { useState } from "react";
import { GearIcon, XIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { useHabits } from "../hooks/HabitsHook";
import RadioGroup from "../ts/RadioGroup";
import PostHabit from "./PostHabit";
import HabitDiv from "../ts/Habit";
import "../../pages/Settings/scss/settings.scss";
import "../../pages/Post/scss/postEditor.scss";
import "../../scss/modules/PostSettings.scss";

export default function PostSettings() {
    const { t } = useTranslation("acc");
    const { blackout, setBlackout } = useBlackout();
    const { privateShow, settingsLoaded } = useSettings();
    const { habits } = useHabits();
    const settings = blackout.postSettings;
    const [ visibility, setVisibility ] = useState(settings?.visibility || "inherit");
    const [ habit, setHabit ] = useState(settings?.habit || "none");

    const [ choosingHabit, setChoosingHabit ] = useState(false);

    const selectedHabit = habits?.find(item => String(item.id) === habit);

    if (!settings) return null;

    const changeVisibility = (value: string) => {
        setVisibility(value);
        settings.setVisibility(value);
    };

    const changeHabit = (value: string) => {
        setHabit(value);
        settings.setHabit(value);
        setChoosingHabit(false);
    };

    if (choosingHabit) return (
        <PostHabit
            selected={habit}
            onSelect={changeHabit}
            onBack={() => setChoosingHabit(false)}
        />
    );

    return (
        <div
            className="postSettingsDiv settingInnerDiv"
            role="dialog"
            aria-modal="true"
            aria-labelledby="postSettingsTitle"
        >
            <div className="postSettingsHeader">
                <div className="settingHeader" id="postSettingsTitle">
                    <GearIcon weight="fill" />
                    {t("editor.settings")}
                </div>
                <button
                    type="button"
                    onClick={() => setBlackout({ seted: false })}
                    aria-label={t("editor.close")}
                >
                    <XIcon />
                </button>
            </div>
            <div className="settingInnerWrapper">
                <div className="settingSpan">{t("editor.visibility")}</div>
                <RadioGroup
                    list={["inherit", "all", "contacts", "nobody"].map(value => ({
                        label: t(`editor.${value}`),
                        value
                    }))}
                    val={visibility}
                    newVal={changeVisibility}
                    id="postVisibility"
                />
            </div>
            <div className="settingHint">
                {settingsLoaded ? t("editor.defaultVisibility", {
                    visibility: t(`editor.${privateShow.posts || "all"}`)
                }) : t("post.loading")}
            </div>
            <div className="settingHint">{t("editor.inheritHint")}</div>
            <div className="settingInnerWrapper">
                <div className="settingSpan">{t("editor.habit")}</div>
                {selectedHabit ? <HabitDiv
                    habit={selectedHabit}
                    onSelect={() => setChoosingHabit(true)}
                    id={selectedHabit.id}
                /> : <button
                    type="button"
                    className="habit postNoHabit"
                    onClick={() => setChoosingHabit(true)}
                    aria-haspopup="dialog"
                >
                    <div className="habitIcon">
                        <ProhibitIcon className="habitIconSvg" />
                    </div>
                    <div className="habitInfo">
                        <div className="habitName">{t("post.noHabit")}</div>
                    </div>
                </button>}
            </div>
        </div>
    );
}
