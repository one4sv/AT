import { FlagIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useUser } from "../../../hooks/UserHook";

type TargetType = "account" | "post" | "message" | "comment" | "activity";

export default function ReportButton({ targetType, targetId, isMy }: {
    targetType: TargetType;
    targetId?: string;
    isMy?: boolean;
}) {
    const { t } = useTranslation("common");
    const { menu, closeMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { user } = useUser();
    const id = String(targetId ?? menu.options.id ?? "");

    if (!user.id || !id || isMy || (targetType === "account" && String(user.id) === id)) return null;

    const open = () => {
        const url = targetType === "account" && menu.options.nick
            ? "/acc/" + encodeURIComponent(menu.options.nick)
            : targetType === "post" ? "/post/" + encodeURIComponent(id)
            : targetType === "activity" ? "/habit/" + encodeURIComponent(id)
            : window.location.pathname;
        closeMenu();
        setBlackout({ seted: true, module: "FeedbackModal", feedback: {
            targetType,
            targetId: id,
            targetUrl: url
        }});
    };

    return <div className="ContextMenuButt" onClick={open}>
        <FlagIcon/> {t("feedback.reportTitle")}
    </div>;
}
