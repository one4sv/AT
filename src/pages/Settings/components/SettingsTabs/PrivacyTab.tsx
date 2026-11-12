import { useEffect, useRef, useState } from "react";
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
import { openCookiePreferences } from "../../../../components/ts/utils/cookieConsent";
import PrivacyExceptions from "../PrivacyExceptions";

export default function PrivacyTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { privateShow, groupInvites, refetchSettings, settingsLoaded } = useSettings();
    const { showNotification } = useNote();
    const [ savingInvites, setSavingInvites ] = useState(false);
    const [ visibleInvites, setVisibleInvites ] = useState(groupInvites);
    const [ visiblePrivate, setVisiblePrivate ] = useState(privateShow);
    useEffect(() => { setVisibleInvites(groupInvites); }, [groupInvites]);
    useEffect(() => { setVisiblePrivate(privateShow); }, [privateShow]);
    const savingRef = useRef(false);
    const inviteOptions = ["direct", "message", "none"].map(value => ({ value, label: t(`privacy.invites.${value}`) }));
    const saveInvites = async (rules: GroupInviteRules) => {
        if (savingRef.current || !settingsLoaded) return;
        savingRef.current = true;
        const previous = visibleInvites;
        setVisibleInvites(rules);
        setSavingInvites(true);
        try {
            const res = await api.post("updatesettings", { group_invites: rules });
            if (!res.data.success) throw new Error();
            await refetchSettings();
        } catch {
            setVisibleInvites(previous);
            showNotification("error", t("privacy.invites.saveError"));
        } finally {
            savingRef.current = false;
            setSavingInvites(false);
        }
    };
    const { setNewPrivateShow } = useUpSettings();

    const applyExceptions = (setting: "activity_invite_exceptions" | "group_invite_exceptions", exceptions: NonNullable<PrivateSettings["activity_invite_exceptions"]>) => {
        const updated: PrivateSettings = { ...visiblePrivate, [setting]: exceptions };
        setVisiblePrivate(updated);
        setNewPrivateShow(updated);
    };

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
        const updated: PrivateSettings = { ...visiblePrivate, [setting]: value };
        setVisiblePrivate(updated);
        setNewPrivateShow(updated);
    };

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="privacy"/>}
            <div className="settingInnerDiv" data-setting-id="privacyAccountInfo">
                <div className="settingHeader">
                    {t("privacy.accountInfo")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPhone")} search={search} /></div>
                    <RadioGroup list={privateArr} val={visiblePrivate.number} newVal={(value) => applyNewPrivate("number", value || "nobody")} id="number"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesEmail")} search={search} /></div>
                    <RadioGroup list={privateArr} val={visiblePrivate.mail} newVal={(value) => applyNewPrivate("mail", value || "nobody")} id="mail"/>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="privacyContentVisibility">
                <div className="settingHeader">
                    {t("privacy.contentVisibility")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesActivities")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.habits} newVal={(value) => applyNewPrivate("habits", value || "nobody")} id="habits"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPosts")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.posts} newVal={(value) => applyNewPrivate("posts", value || "nobody")} id="posts"/>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="privacyActivityInvites">
                <div className="settingHeader">{t("privacy.exceptions.activityTitle")}</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.exceptions.activityWho")}</div>
                    <RadioGroup list={[
                        { label: t("privacy.all"), value: "all" },
                        { label: t("privacy.contacts"), value: "contacts" },
                        { label: t("privacy.nobody"), value: "nobody" }
                    ]} val={visiblePrivate.activity_invites || "all"} newVal={value => applyNewPrivate("activity_invites", value || "all")} id="activityInvites"/>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="activityInviteExceptions">
                <div className="settingHeader">{t("privacy.exceptions.activityExceptions")}</div>
                <PrivacyExceptions
                    mode="activity"
                    exceptions={visiblePrivate.activity_invite_exceptions || {}}
                    activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites}
                    onChange={exceptions => applyExceptions("activity_invite_exceptions", exceptions)}
                />
            </div>
            <div className="settingInnerDiv" data-setting-id="groupInvites">
                <div className="settingHeader"><HighlightText text={t("privacy.invites.title")} search={search}/></div>
                <div className="settingHint">{t("privacy.invites.hint")}</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.contacts")}</div>
                    <RadioGroup list={inviteOptions} val={visibleInvites.contacts} disabled={savingInvites || !settingsLoaded} id="groupInviteContacts" newVal={value => void saveInvites({ ...visibleInvites, contacts: value as GroupInviteRules["contacts"] })}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.others")}</div>
                    <RadioGroup list={inviteOptions} val={visibleInvites.others} disabled={savingInvites || !settingsLoaded} id="groupInviteOthers" newVal={value => void saveInvites({ ...visibleInvites, others: value as GroupInviteRules["others"] })}/>
                </div>

            </div>
            <div className="settingInnerDiv" data-setting-id="groupInviteExceptions">
                <div className="settingHeader">{t("privacy.exceptions.groupExceptions")}</div>
                <PrivacyExceptions
                    mode="group"
                    exceptions={visiblePrivate.group_invite_exceptions || {}}
                    activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites}
                    onChange={exceptions => applyExceptions("group_invite_exceptions", exceptions)}
                />
            </div>
            <div className="settingInnerDiv" data-setting-id="cookieConsent">
                <div className="settingHeader">
                    <HighlightText text={t("privacy.cookies")} search={search} />
                    <button type="button" className="securityAction" onClick={openCookiePreferences}>
                        {t("privacy.manageCookies")}
                    </button>
                </div>
                <span className="settingHint">{t("privacy.cookiesHint")}</span>
            </div>

        </div>
    );
}