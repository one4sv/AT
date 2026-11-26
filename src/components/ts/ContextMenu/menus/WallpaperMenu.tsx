import { ArrowsOutIcon, CheckIcon, TrashIcon, ShareFatIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";

export default function WallpaperMenu() {
    const { t } = useTranslation("settings");
    const { menu, closeMenu } = useContextMenu();
    const { onOpen, onSave, onDelete, onShare } = menu.options;
    const run = (action?: () => void) => {
        closeMenu();
        action?.();
    };
    return <>
        {onShare && <div className="ContextMenuButt" onClick={() => run(onShare)}><ShareFatIcon/>{t("sharing.shareObject")}</div>}
        <div className="ContextMenuButt" onClick={() => run(onOpen)}><ArrowsOutIcon/>{t("backgroundLibrary.preview")}</div>
        <div className="ContextMenuButt" onClick={() => run(onSave)}><CheckIcon/>{t("general.compositionApply")}</div>
        {onDelete && <div className="ContextMenuButt delete" onClick={() => run(onDelete)}><TrashIcon/>{t("backgroundLibrary.delete")}</div>}
    </>;
}
