import { Link } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";

export default function LinkButton() {
    const { menu } = useContextMenu();
    const { point, options, chatInfo } = menu;
    const CopyLink = import.meta.env.VITE_LINK;

    const handleCopy = () => {
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

        navigator.clipboard.writeText(`${CopyLink}/${link}`);
    };

    return (
        <div className="ContextMenuButt" onClick={handleCopy}>
            <Link />
            Скопировать ссылку
        </div>
    );
}