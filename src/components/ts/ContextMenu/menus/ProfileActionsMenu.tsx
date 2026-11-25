import { ChatTeardropTextIcon, PencilSimpleIcon, ShareFatIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useUser } from "../../../hooks/UserHook";
import { ToggleBlocked } from "../buttons/ToggleBlocked";

export default function ProfileActionsMenu() {
    const { t } = useTranslation("acc");
    const { menu, closeMenu } = useContextMenu();
    const { user } = useUser();
    const { options } = menu;
    const run = (action?: () => void) => { closeMenu(); action?.(); };
    return <>
        {options.onOpen && <div className="ContextMenuButt" onClick={() => run(options.onOpen)}>
            <ChatTeardropTextIcon />{t("message")}
        </div>}
        {options.onEdit && <div className="ContextMenuButt" onClick={() => run(options.onEdit)}>
            <PencilSimpleIcon />{t(options.isMy ? "edit" : "rename")}
        </div>}
        {options.onShare && <div className="ContextMenuButt" onClick={() => run(options.onShare)}>
            <ShareFatIcon />{t("share")}
        </div>}
        {user.id && !options.isMy && <ToggleBlocked id={options.id} nick={options.nick} name={options.name}/>}
    </>;
}
