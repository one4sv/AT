import { useRef, useState } from "react";
import { api } from "../../../../components/ts/api";
import { useNote } from "../../../../components/hooks/NoteHook";
import type { GroupInviteRules } from "../../../../components/context/SettingsContext";
import { type Option } from "../../../../components/ts/SelectList";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import { type PrivateSettings } from "../../../../components/context/SettingsContext";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";

export default function PrivacyTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { privateShow, groupInvites, refetchSettings, settingsLoaded } = useSettings();
    const { showNotification } = useNote();
    const [ savingInvites, setSavingInvites ] = useState(false);
    const savingRef = useRef(false);
    const inviteOptions = ["direct", "message", "none"].map(value => ({ value, label: t(`privacy.invites.${value}`) }));
    const saveInvites = async (rules: GroupInviteRules) => {
        if (savingRef.current || !settingsLoaded) return;
        savingRef.current = true;
        setSavingInvites(true);
        try {
            const res = await api.post("updatesettings", { group_invites: rules });
            if (!res.data.success) throw new Error();
            await refetchSettings();
        } catch {
            showNotification("error", t("privacy.invites.saveError"));
        } finally {
            savingRef.current = false;
            setSavingInvites(false);
        }
    };
    const { setNewPrivateShow } = useUpSettings();

    const privateArr: Option[] = [
        { label: t("privacy.nobody"), value: "nobody" },
        { label: t("privacy.contacts"), value: "contacts" },
    ];

    const privateArrFull: Option[] = [
        ...privateArr,
        { label: t("privacy.all"), value: "all" },
    ];

    const applyNewPrivate = (setting: keyof PrivateSettings, value: string) => {
        if (!privateShow) return;
        const updated: PrivateSettings = { ...privateShow, [setting]: value };
        setNewPrivateShow(updated);
    };

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="privacy"/>}
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("privacy.accountInfo")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPhone")} search={search} /></div>
                    <RadioGroup list={privateArr} val={privateShow.number} newVal={(value) => applyNewPrivate("number", value || "nobody")} id="number"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesEmail")} search={search} /></div>
                    <RadioGroup list={privateArr} val={privateShow.mail} newVal={(value) => applyNewPrivate("mail", value || "nobody")} id="mail"/>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("privacy.contentVisibility")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesActivities")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={privateShow.habits} newVal={(value) => applyNewPrivate("habits", value || "nobody")} id="habits"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPosts")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={privateShow.posts} newVal={(value) => applyNewPrivate("posts", value || "nobody")} id="posts"/>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="groupInvites">
                <div className="settingHeader"><HighlightText text={t("privacy.invites.title")} search={search}/></div>
                <div className="settingHint">{t("privacy.invites.hint")}</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.contacts")}</div>
                    <RadioGroup list={inviteOptions} val={groupInvites.contacts} disabled={savingInvites || !settingsLoaded} id="groupInviteContacts" newVal={value => void saveInvites({ ...groupInvites, contacts: value as GroupInviteRules["contacts"] })}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.others")}</div>
                    <RadioGroup list={inviteOptions} val={groupInvites.others} disabled={savingInvites || !settingsLoaded} id="groupInviteOthers" newVal={value => void saveInvites({ ...groupInvites, others: value as GroupInviteRules["others"] })}/>
                </div>
            </div>
        </div>
    );
}