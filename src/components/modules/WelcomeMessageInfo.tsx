import "../../pages/Chat/scss/welcome.scss";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";

export default function WelcomeMessageInfo() {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();

    return (
        <div className="welcomeMessageInfoModal" role="dialog" aria-modal="true" aria-label={t("chats.welcomeInfoTitle")}>
            <div className="welcomeMessageInfoTitle">{t("chats.welcomeInfoTitle")}</div>
            <p>{t("chats.welcomeInfoDescription")}</p>
            <button type="button" onClick={() => setBlackout({ seted: false })}>
                {t("chats.welcomeInfoButton")}
            </button>
        </div>
    );
}
