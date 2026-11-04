import { useEffect, useState } from "react";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import EmojiNet from "../../../../components/ts/EmojiNet";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { reactionsArr } from "../../../../components/ts/utils/emojies";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";
import Toggler from "../../../../components/ts/Toggler";
import TA from "../../../../components/ts/TA";
import { useNote } from "../../../../components/hooks/NoteHook";
import { api } from "../../../../components/ts/api";
import type { ChatWelcomeSettings } from "../../../../components/context/SettingsContext";
import "./ChatWelcomeSettings.scss";

import SectionArt from "../../../../components/ts/SectionArt";

export default function ChatsTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { setNewEmote, setNewMessdb } = useUpSettings();
    const { emote, messdb, chatWelcome, setChatWelcome, settingsLoaded } = useSettings();
    const { showNotification } = useNote();
    const [ welcomeDraft, setWelcomeDraft ] = useState<ChatWelcomeSettings>(chatWelcome);
    const [ savingWelcome, setSavingWelcome ] = useState(false);

    useEffect(() => {
        setWelcomeDraft(chatWelcome);
    }, [chatWelcome]);

    const saveWelcome = async (override?: ChatWelcomeSettings) => {
        if (savingWelcome || !settingsLoaded) return;

        const source = override ?? welcomeDraft;
        const next: ChatWelcomeSettings = {
            enabled: source.enabled,
            text: source.text.trim()
        };
        if (next.enabled && !next.text) return;

        setSavingWelcome(true);
        try {
            const res = await api.post("updatesettings", { chat_welcome: next });
            if (!res.data?.success) throw new Error("Could not save greeting");
            setChatWelcome(next);
            showNotification("success", t("chats.welcomeSaved"));
        } catch {
            showNotification("error", t("chats.welcomeSaveError"));
        } finally {
            setSavingWelcome(false);
        }
    };

    const changeWelcomeEnabled = (enabled: boolean) => {
        const next = { ...welcomeDraft, enabled };
        setWelcomeDraft(next);
        if (enabled && !next.text.trim()) return;
        void saveWelcome(next);
    };

    const changedWelcome = welcomeDraft.enabled !== chatWelcome.enabled || welcomeDraft.text !== chatWelcome.text;
    const invalidWelcome = welcomeDraft.enabled && !welcomeDraft.text.trim();

    const doubleClickArr = [
        { label: t("chats.reaction"), value: "reaction" },
        { label: t("chats.answer"), value: "answer" },
        { label: t("chats.select"), value: "select" },
    ];

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="chats"/>}
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("chats.header")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan"><HighlightText text={t("chats.defaultReaction")} search={search} /></div>
                    <div className="chatTabSLDiv">
                        <EmojiNet list={reactionsArr} val={emote} newVal={(val) => setNewEmote(val)} id="defaultReaction"/>
                    </div>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan"><HighlightText text={t("chats.doubleClick")} search={search} /></div>
                    <div className="chatTabSLDiv">
                        <RadioGroup list={doubleClickArr} val={messdb} newVal={(val) => setNewMessdb(val)} id="doubleClick"/>
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="welcomeMessage">
                <div className="settingHeader">
                    <HighlightText text={t("chats.welcomeTitle")} search={search}/>
                </div>
                <div className="settingHint">{t("chats.welcomeHint")}</div>
                <div className="settingInnerList">
                    <div
                        className="settingTogglerDiv"
                        onClick={() => {
                            if (!savingWelcome && settingsLoaded) changeWelcomeEnabled(!welcomeDraft.enabled);
                        }}
                    >
                        <span>{t("chats.welcomeEnable")}</span>
                        <Toggler
                            state={welcomeDraft.enabled}
                            disable={savingWelcome || !settingsLoaded}
                            stopPropagation
                            onToggle={changeWelcomeEnabled}
                        />
                    </div>
                </div>
                <div className="chatWelcomeSettings">
                    <label htmlFor="chatWelcomeText">{t("chats.welcomeText")}</label>
                    <TA
                        id="chatWelcomeText"
                        value={welcomeDraft.text}
                        maxLength={500}
                        maxHeight={20}
                        minHeight={5}
                        disabled={savingWelcome || !settingsLoaded}
                        placeholder={t("chats.welcomePlaceholder")}
                        onChange={event => setWelcomeDraft(current => ({ ...current, text: event.target.value }))}
                    />
                    <div className="chatWelcomeSettingsBottom">
                        <span className={invalidWelcome ? "chatWelcomeInvalid" : ""}>
                            {invalidWelcome
                                ? t("chats.welcomeRequired")
                                : t("chats.welcomeLength", { count: welcomeDraft.text.length })}
                        </span>
                        <button
                            type="button"
                            disabled={!settingsLoaded || savingWelcome || !changedWelcome || invalidWelcome}
                            onClick={() => void saveWelcome()}
                        >
                            {savingWelcome ? t("chats.welcomeSaving") : t("chats.welcomeSave")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}