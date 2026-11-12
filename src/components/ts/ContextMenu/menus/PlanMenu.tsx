import { ArrowCounterClockwiseIcon, CheckCircleIcon, CircleIcon, FloppyDiskIcon, PencilSimpleIcon, PushPinIcon, PushPinSlash, ShareNetworkIcon, TrashIcon, XCircleIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { usePlans } from "../../../hooks/PlansHook";
import { useNote } from "../../../hooks/NoteHook";
import { useSettings } from "../../../hooks/SettingsHook";
import { api } from "../../api";
import LinkButton from "../buttons/LinkButton";

export default function PlanMenu() {
    const { t } = useTranslation("common");
    const { menu, closeMenu } = useContextMenu();
    const { setPin, refreshPlans, plans } = usePlans();
    const { privateShow } = useSettings();
    const { showNotification } = useNote();
    const { options } = menu;
    const isItem = menu.point === "planItem";
    const canManage = !isItem && !!options.isMy;
    const target = plans.find(item => String(item.id) === String(options.id));
    const link = new URL("/plan/" + encodeURIComponent(options.id),window.location.origin);
    const linkOnly = !!options.shareToken || target?.visibility === "link" || (target?.visibility === "inherit" && privateShow.plans === "link") || !!new URLSearchParams(window.location.search).get("share");
    const token = options.shareToken || (linkOnly ? target?.share_token : undefined) ||
        new URLSearchParams(window.location.search).get("share");
    if (linkOnly && token) link.searchParams.set("share",token);
    const url = link.href;

    const run = (action?: () => void) => {
        closeMenu();
        if (!options.disabled) action?.();
    };
    const pin = async () => {
        if (options.disabled) return;
        closeMenu();
        try {
            await setPin(Number(options.id), !options.pinned);
        } catch {
            showNotification("error", t("plans.saveError"));
        }
    };
    const complete = async () => {
        closeMenu();
        try {
            await api.post("plans/" + options.id + "/complete", { completed: !options.completed });
            await refreshPlans();
            window.dispatchEvent(new CustomEvent("plan-updated", { detail: { id: options.id } }));
        } catch {
            showNotification("error", t("plans.saveError"));
        }
    };
    const share = async () => {
        closeMenu();
        if (!navigator.share) {
            try {
                await navigator.clipboard.writeText(url);
                showNotification("success", t("links.copied"));
            } catch {
                showNotification("error", t("links.copyFailed"));
            }
            return;
        }
        try {
            await navigator.share({ title: options.name || t("plans.title"), url });
        } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError"))
                showNotification("error", t("links.copyFailed"));
        }
    };

    return <>
        {isItem && options.canComplete && <div className="ContextMenuButt" onClick={() => void complete()}>
            {options.completed ? <CheckCircleIcon weight="fill"/> : <CircleIcon/>}
            {t(options.completed ? "plans.undoCompletion" : "habitUi.complete")}
        </div>}
        {canManage && (options.type === "editing" ? <>
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
        </>)}
        <LinkButton/>
        <div className="ContextMenuButt" onClick={() => void share()}>
            <ShareNetworkIcon/>{t("plans.share")}
        </div>
        {options.canPin && <div className="ContextMenuButt" onClick={() => void pin()}>
            {options.pinned ? <PushPinSlash/> : <PushPinIcon/>}
            {t(options.pinned ? "habitUi.unpin" : "habitUi.pin")}
        </div>}
    </>;
}
