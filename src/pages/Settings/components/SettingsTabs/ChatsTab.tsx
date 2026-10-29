import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import EmojiNet from "../../../../components/ts/EmojiNet";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { reactionsArr } from "../../../../components/ts/utils/emojies";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";

export default function ChatsTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { setNewEmote, setNewMessdb } = useUpSettings();
    const { emote, messdb } = useSettings();

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
        </div>
    );
}