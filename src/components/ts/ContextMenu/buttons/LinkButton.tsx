import { Link } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useNote } from "../../../hooks/NoteHook";
import { useTranslation } from "react-i18next";
import { usePlans } from "../../../hooks/PlansHook";
import { useSettings } from "../../../hooks/SettingsHook";

export default function LinkButton() {
    const { menu } = useContextMenu();
    const { point, options, chatInfo } = menu;
    const { showNotification } = useNote();
    const { t } = useTranslation("common");
    const CopyLink = (import.meta.env.VITE_LINK || window.location.origin).replace(/\/+$/, "");
    const { plans } = usePlans();
    const { privateShow, profileShareToken } = useSettings();

    const handleCopy = async () => {
        const link =
            point === "habit"
                ? `habit/${options.id}`
                : point === "plan" || point === "planItem"
                ? `plan/${options.id}`
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
            const url = new URL(`${CopyLink}/${link}`);
            if (point === "habit") {
                const inherited = new URLSearchParams(window.location.search).get("share");
                const token = inherited || (options.isMy && privateShow.habits === "link" ? profileShareToken : null);
                if (token) url.searchParams.set("share",token);
            }
            if (point === "plan" || point === "planItem") {
                const plan = plans.find(item => String(item.id) === String(options.id));
                const linkOnly = !!options.shareToken || plan?.visibility === "link" || (plan?.visibility === "inherit" && privateShow.plans === "link") || !!new URLSearchParams(window.location.search).get("share");
                const token = options.shareToken || (linkOnly ? plan?.share_token : null) ||
                    new URLSearchParams(window.location.search).get("share");
                if (linkOnly && token) url.searchParams.set("share",token);
            }
            await navigator.clipboard.writeText(url.href);
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
