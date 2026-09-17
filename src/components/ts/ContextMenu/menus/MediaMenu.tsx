import { ChatTeardrop } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useMessages } from "../../../hooks/MessagesHook";
import { DownloadButt } from "../buttons/DownloadButt";

export default function MediaMenu() {
    const { menu } = useContextMenu();
    const { setPendingScrollId } = useMessages();
    const navigate = useNavigate();

    const { options } = menu;

    return (
        <>
            {options.url && options.name && DownloadButt(options.url, options.name)}

            <div
                className="ContextMenuButt"
                onClick={() => {
                    setPendingScrollId(Number(options.id));
                    navigate(`/chat/${options.nick}`);
                }}
            >
                <ChatTeardrop style={{ transform: "scaleX(-1)" }} />
                Показать в чате
            </div>
        </>
    );
}