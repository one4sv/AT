import { useTranslation } from "react-i18next";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useMessages } from "../../../hooks/MessagesHook";

export default function MessBarMenu() {
    const { t } = useTranslation("common");
    const { showNames, setShowNames } = useMessages();

    return (
        <div
            className="ContextMenuButt"
            onClick={() => setShowNames(!showNames)}
        >
            {showNames ? <EyeSlash /> : <Eye />}
            {t(showNames ? "chatMenu.hideNames" : "chatMenu.showNames")}
        </div>
    );
}