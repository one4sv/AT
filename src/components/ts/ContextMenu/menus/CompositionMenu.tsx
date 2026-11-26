import { ArrowsOutIcon, CopyIcon, PencilSimpleIcon, StackIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";

export default function CompositionMenu() {
    const { t } = useTranslation("settings");
    const { menu, closeMenu } = useContextMenu();
    const { options } = menu;
    const label = (key: string) => t("personalization.compositions." + key);
    const run = (action?: () => void) => {
        closeMenu();
        action?.();
    };

    return <>
        <div className="ContextMenuButt" onClick={() => run(options.onOpen)}>
            <ArrowsOutIcon/>{t("general.compositionPreview")}
        </div>
        <div className="ContextMenuButt" onClick={() => run(options.onEdit)}>
            <PencilSimpleIcon/>{label("rename")}
        </div>
        <div className="ContextMenuButt" onClick={() => run(options.onSave)}>
            <StackIcon/>{label("overwrite")}
        </div>
        <div className="ContextMenuButt" aria-disabled={!options.canDuplicate}
            onClick={() => { if (options.canDuplicate) run(options.onDuplicate); }}>
            <CopyIcon/>{label("duplicate")}
        </div>
        <div className="ContextMenuButt delete" onClick={() => run(options.onDelete)}>
            <TrashIcon/>{label("remove")}
        </div>
    </>;
}
