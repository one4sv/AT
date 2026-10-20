import { Link } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useNote } from "../../../hooks/NoteHook";
import { useTranslation } from "react-i18next";

export default function LinkButton() {
    const { menu } = useContextMenu();
    const { point, options, chatInfo } = menu;
    const { showNotification } = useNote();
    const { t } = useTranslation("common");
    const CopyLink = (import.meta.env.VITE_LINK || window.location.origin).replace(/\/+$/, "");

    const handleCopy = async () => {
        const link =
            point === "habit"
                ? `habit/${options.id}`
                : point === "chat"
                ? chatInfo?.is_group
                    ? `chat/g/${options.id}`
                    : `chat/${options.nick}`
                : point === "acc"
                ? chatInfo?.is_group
                    ? `room/${options.id}`
                    : `acc/${options.nick}`
                : point === "member"
                ? `acc/${options.nick}`
                : "";

        if (!link) return;
        try {
            await navigator.clipboard.writeText(`${CopyLink}/${link}`);
            showNotification("success", t("links.copied"));
        } catch {
            showNotification("error", t("links.copyFailed"));
        }
    };

    return (
        <div className="ContextMenuButt" onClick={handleCopy}>
            <Link />
            {t("links.copy")}
        </div>
    );
}
