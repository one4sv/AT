import { PlusIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useSettings } from "../../../hooks/SettingsHook";
import { useUser } from "../../../hooks/UserHook";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useTranslation } from "react-i18next";
import { QuickActionVisual, quickActionPath } from "../../utils/quickActions";

export default function HeaderQuickActionMenu() {
    const { t } = useTranslation("settings");
    const { quickActions } = useSettings();
    const { user } = useUser();
    const { closeMenu } = useContextMenu();
    const navigate = useNavigate();

    return (
        <>
            {quickActions.map(action => (
                <div
                    className="ContextMenuButt quickActionMenuButt"
                    key={`${action.type}:${action.target || ""}`}
                    onClick={() => {
                        closeMenu();
                        navigate(quickActionPath(action, user.nick));
                    }}
                >
                    <QuickActionVisual action={action}/>
                </div>
            ))}
            <div
                className="ContextMenuButt quickActionMenuButt"
                onClick={() => {
                    closeMenu();
                    navigate("/settings/gen", { state: { settingId: "quickActions" } });
                }}
            >
                <PlusIcon />
                {t("general.quickActionsAdd")}
            </div>
        </>
    );
}
