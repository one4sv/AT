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
                    className="ContextMenuButt"
                    key={`${action.type}:${action.target || ""}`}
                    onClick={() => {
                        closeMenu();
                        navigate(quickActionPath(action, user.nick));
                    }}
                >
                    <QuickActionVisual action={action} inMenu/>
                </div>
            ))}
            {quickActions.length < 3 && <div
                className="ContextMenuButt"
                onClick={() => {
                    closeMenu();
                    navigate("/settings/gen", { state: { settingId: "quickActions" } });
                }}
            >
                <PlusIcon color="var(--accent_text)"/>
                {t("general.quickActionsAdd")}
            </div>}
        </>
    );
}
