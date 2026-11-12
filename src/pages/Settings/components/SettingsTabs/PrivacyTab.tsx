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

    const applyExceptions = (setting: keyof PrivateSettings, exceptions: NonNullable<PrivateSettings["activity_invite_exceptions"]>) => {
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
        { label: t("privacy.link"), value: "link" }
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
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesAccountInfo")} search={search}/></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.profile || "all"}
                        newVal={value => applyNewPrivate("profile",value || "nobody")} id="profile"/>
                </div>
                <PrivacyExceptions mode="profile" exceptions={visiblePrivate.profile_exceptions || {}}
                    rule={visiblePrivate.profile || "all"} activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites} onChange={rules => applyExceptions("profile_exceptions",rules)}/>
            </div>

            <div className="settingInnerDiv" data-setting-id="privacyActivitiesVisibility">
                <div className="settingHeader">
                    {t("privacy.activitiesVisibility")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesActivities")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.habits} newVal={(value) => applyNewPrivate("habits", value || "nobody")} id="habits"/>
                </div>
                <PrivacyExceptions mode="habits" exceptions={visiblePrivate.habits_exceptions || {}}
                    rule={visiblePrivate.habits} activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites} onChange={rules => applyExceptions("habits_exceptions",rules)}/>
            </div>

            <div className="settingInnerDiv" data-setting-id="privacyPostsVisibility">
                <div className="settingHeader">
                    {t("privacy.postsVisibility")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPosts")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.posts} newVal={(value) => applyNewPrivate("posts", value || "nobody")} id="posts"/>
                </div>
                <PrivacyExceptions mode="posts" exceptions={visiblePrivate.posts_exceptions || {}}
                    rule={visiblePrivate.posts} activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites} onChange={rules => applyExceptions("posts_exceptions",rules)}/>
            </div>

            <div className="settingInnerDiv" data-setting-id="privacyPlansVisibility">
                <div className="settingHeader">
                    {t("privacy.plansVisibility")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPlans")} search={search}/></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.plans || "nobody"}
                        newVal={value => applyNewPrivate("plans",value || "nobody")} id="plans"/>
                </div>
                <PrivacyExceptions mode="plans" exceptions={visiblePrivate.plans_exceptions || {}}
                    rule={visiblePrivate.plans || "nobody"} activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites} onChange={rules => applyExceptions("plans_exceptions",rules)}/>
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
                <PrivacyExceptions
                    mode="activity"
                    exceptions={visiblePrivate.activity_invite_exceptions || {}}
                    activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites}
                    onChange={exceptions => applyExceptions("activity_invite_exceptions", exceptions)}
                />
            </div>

            <div className="settingInnerDiv" data-setting-id="planInvites">
                <div className="settingHeader">{t("privacy.planInvitesTitle")}</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.planInvitesWho")}</div>
                    <RadioGroup list={[
                        { label:t("privacy.all"),value:"all" },
                        { label:t("privacy.contacts"),value:"contacts" },
                        { label:t("privacy.nobody"),value:"nobody" }
                    ]} val={visiblePrivate.plan_invites || "contacts"}
                        newVal={value => applyNewPrivate("plan_invites",value || "contacts")} id="planInvites"/>
                </div>
                <PrivacyExceptions mode="plan-invite" exceptions={visiblePrivate.plan_invite_exceptions || {}}
                    rule={visiblePrivate.plan_invites || "contacts"} activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites} onChange={rules => applyExceptions("plan_invite_exceptions",rules)}/>
            </div>
            <div className="settingInnerDiv" data-setting-id="groupInvites">
                <div className="settingHeader"><HighlightText text={t("privacy.invites.title")} search={search}/></div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.contacts")}</div>
                    <RadioGroup list={inviteOptions} val={visibleInvites.contacts} disabled={savingInvites || !settingsLoaded} id="groupInviteContacts" newVal={value => void saveInvites({ ...visibleInvites, contacts: value as GroupInviteRules["contacts"] })}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.others")}</div>
                    <RadioGroup list={inviteOptions} val={visibleInvites.others} disabled={savingInvites || !settingsLoaded} id="groupInviteOthers" newVal={value => void saveInvites({ ...visibleInvites, others: value as GroupInviteRules["others"] })}/>
                </div>
                                <div className="settingHeader">{t("privacy.exceptions.groupExceptions")}</div>
                <PrivacyExceptions
                    mode="group"
                    exceptions={visiblePrivate.group_invite_exceptions || {}}
                    activityRule={visiblePrivate.activity_invites || "all"}
                    groupRules={visibleInvites}
                    onChange={exceptions => applyExceptions("group_invite_exceptions", exceptions)}
                />
            </div>
        </div>
    );
}