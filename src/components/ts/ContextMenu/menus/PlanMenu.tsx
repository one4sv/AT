import { ArrowCounterClockwiseIcon, FloppyDiskIcon, PencilSimpleIcon, TrashIcon, XCircleIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";

export default function PlanMenu() {
    const { t } = useTranslation("common");
    const { menu, closeMenu } = useContextMenu();
    const { options } = menu;
    if (!options.isMy) return null;

    const run = (action?: () => void) => {
        closeMenu();
        if (!options.disabled) action?.();
    };

    return <>
        {options.type === "editing" ? <>
            <div className="ContextMenuButt" onClick={() => run(options.onSave)}>
                <FloppyDiskIcon/>{t("plans.save")}
            </div>
            <div className="ContextMenuButt" onClick={() => run(options.onStopEdit)}>
                <XCircleIcon/>{t("plans.back")}
            </div>
        </> : <>
            <div className="ContextMenuButt" onClick={() => run(options.onEdit)}>
                <PencilSimpleIcon/>{t("plans.edit")}
            </div>
            <div className={`ContextMenuButt ${options.type !== "canceled" ? "delete" : ""}`}
                onClick={() => run(options.onToggleCancel)}>
                {options.type === "canceled" ? <ArrowCounterClockwiseIcon/> : <XCircleIcon/>}
                {t(options.type === "canceled" ? "plans.restore" : "plans.cancel")}
            </div>
            <div className="ContextMenuButt delete" onClick={() => run(options.onConfirmDelete)}>
                <TrashIcon/>{t("plans.delete")}
            </div>
        </>}
    </>;
}
