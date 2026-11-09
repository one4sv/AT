import { useTranslation } from "react-i18next";
import { ChatTeardrop } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useMessages } from "../../../hooks/MessagesHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { DownloadButt } from "../buttons/DownloadButt";

export default function MediaMenu() {
    const { t } = useTranslation("common");
    const { menu } = useContextMenu();
    const { setPendingScrollId } = useMessages();
    const { setBlackoutStack } = useBlackout();
    const navigate = useNavigate();

    const { options } = menu;

    return (
        <>
            {options.url && options.name && DownloadButt(options.url, options.name)}

            <div
                className="ContextMenuButt"
                onClick={() => {
                    setPendingScrollId(Number(options.id));
                    setBlackoutStack([]);
                    navigate(`/chat/${options.nick}`);
                }}
            >
                <ChatTeardrop style={{ transform: "scaleX(-1)" }} />
                {t("chatMenu.showInChat")}
            </div>
        </>
    );
}