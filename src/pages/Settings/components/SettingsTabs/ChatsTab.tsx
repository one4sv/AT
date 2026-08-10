import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import EmojiNet from "../../../../components/ts/EmojiNet";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { reactionsArr } from "../../../../components/ts/utils/emojies";
import { useTranslation } from "react-i18next";

export default function ChatsTab() {
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
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("chats.header")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">{t("chats.defaultReaction")}</div>
                    <div className="chatTabSLDiv">
                        <EmojiNet list={reactionsArr} val={emote} newVal={(val) => setNewEmote(val)} />
                    </div>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">{t("chats.doubleClick")}</div>
                    <div className="chatTabSLDiv">
                        <RadioGroup list={doubleClickArr} val={messdb} newVal={(val) => setNewMessdb(val)} />
                    </div>
                </div>
            </div>
        </div>
    );
}