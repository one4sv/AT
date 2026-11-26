import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import "./scss/SelectMessageText.scss";

export default function SelectMessageText() {
    const { t } = useTranslation("common");
    const { blackout } = useBlackout();

    return (
        <div className="selectMessageText">
            <label htmlFor="selected-message-text">{t("chatMenu.selectText")}</label>
            <textarea id="selected-message-text" readOnly value={blackout.options?.text ?? ""}/>
        </div>
    );
}
