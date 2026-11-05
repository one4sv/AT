import i18n from "../../../i18n/i18n";

// The server stores these historical system messages in Russian.
// Keep the original value as a fallback for unknown or newer events.
export default function localizeSystemMessage(content: string) {
    const messages: Record<string, string> = {
        "добавил {} в беседу": "added",
        "исключил {} из беседы": "removed",
        "покинул беседу": "left",
        "присоединился по ссылке-приглашению": "joinedByLink",
        "обновил название беседы": "updatedName",
        "обновил описание беседы": "updatedDescription",
        "обновил название и описание беседы": "updatedNameAndDescription",
        "обновил аватарку беседы": "updatedAvatar"
    };

    const key = messages[content];

    if (key) return i18n.t(`systemMessages.${key}`, { ns: "common" });

    const created = content.match(/^создал беседу "(.+)"$/);

    if (created) return i18n.t("systemMessages.created", { ns: "common", name: created[1] });

    return content;
}
