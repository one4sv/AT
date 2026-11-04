import { PlusIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export default function HeaderQuickActionMenu() {
    const { t } = useTranslation("common");

    return (
        <div className="ContextMenuButt" aria-disabled="true">
            <PlusIcon />
            {t("headerQuickAction")}
        </div>
    );
}
