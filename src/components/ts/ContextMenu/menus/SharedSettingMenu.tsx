import { LinkIcon, CheckCircleIcon, ArrowSquareOutIcon, ShareFatIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useNote } from "../../../hooks/NoteHook";

export default function SharedSettingMenu() {
    const { t } = useTranslation("settings");
    const { menu, closeMenu } = useContextMenu();
    const { showNotification } = useNote();
    const { setBlackout } = useBlackout();

    return <>
        {(menu.options.onShare || menu.options.url) && <div className="ContextMenuButt" onClick={() => { closeMenu(); if (menu.options.onShare) menu.options.onShare(); else if (menu.options.url) setBlackout({seted:true,module:"ShareObject",shareObject:{url:menu.options.url,name:menu.options.name}}); }}><ShareFatIcon/>{t("sharing.shareObject")}</div>}
        {menu.options.onOpen && <div className="ContextMenuButt" onClick={() => { closeMenu(); menu.options.onOpen?.(); }}><ArrowSquareOutIcon/>{t("sharing.open")}</div>}
        {menu.options.onApply && <div className="ContextMenuButt" onClick={() => { closeMenu(); menu.options.onApply?.(); }}><CheckCircleIcon/>{t("general.compositionApply")}</div>}
        <div className="ContextMenuButt" onClick={async () => {
        const url = menu.options.url;
        closeMenu();
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            showNotification("success", t("sharing.copied"));
        } catch {
            showNotification("error", t("sharing.copyFailed"));
        }
    }}>
        <LinkIcon/>{t("sharing.copy")}
    </div></>;
}
