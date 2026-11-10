import { useTranslation } from "react-i18next";
import { ChatTeardrop, CopySimple, ShareFat } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useMessages } from "../../../hooks/MessagesHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { DownloadButt } from "../buttons/DownloadButt";
import useForwardMedia from "../../../hooks/utils/useForwardMedia";

export default function MediaMenu() {
    const { t } = useTranslation("common");
    const { menu } = useContextMenu();
    const { setPendingScrollId } = useMessages();
    const { setBlackoutStack } = useBlackout();
    const navigate = useNavigate();
    const forwardMedia = useForwardMedia();

    const { options } = menu;

    return (
        <>
            {options.url && options.name && options.type !== "text/url" && DownloadButt(options.url, options.name)}

            {options.url && <div className="ContextMenuButt" onClick={() => forwardMedia({
                url: options.url!,
                name: options.name || "media",
                type: options.type,
                isLink: options.type === "text/url"
            })}>
                <ShareFat />
                {t("chatMenu.forward")}
            </div>}

            {options.onCopyLink && (
                <div className="ContextMenuButt" onClick={options.onCopyLink}>
                    <CopySimple />
                    {t("chatMenu.copy")}
                </div>
            )}

            {options.nick && Number.isSafeInteger(Number(options.id)) && Number(options.id) > 0 && <div
                className="ContextMenuButt"
                onClick={() => {
                    setPendingScrollId(Number(options.id));
                    setBlackoutStack([]);
                    navigate(`/chat/${options.nick}`);
                }}
            >
                <ChatTeardrop style={{ transform: "scaleX(-1)" }} />
                {t("chatMenu.showInChat")}
            </div>}
        </>
    );
}