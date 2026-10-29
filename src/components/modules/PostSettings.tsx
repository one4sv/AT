import { useState } from "react";
import { GearIcon, XIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { useHabits } from "../hooks/HabitsHook";
import RadioGroup from "../ts/RadioGroup";
import SelectList from "../ts/SelectList";
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

    if (!settings) return null;

    const changeVisibility = (value: string) => {
        setVisibility(value);
        settings.setVisibility(value);
    };

    const changeHabit = (value: string) => {
        setHabit(value);
        settings.setHabit(value);
    };

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
                <SelectList
                    className="postEditorHabit"
                    arr={[
                        { label: t("post.noHabit"), value: "none" },
                        ...(habits || []).map(item => ({ label: item.name, value: String(item.id) }))
                    ]}
                    selected={habit}
                    onChange={changeHabit}
                />
            </div>
        </div>
    );
}
