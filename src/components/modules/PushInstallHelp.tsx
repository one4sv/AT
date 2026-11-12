import { Share2, Smartphone, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import "./scss/PushInstallHelp.scss";

export default function PushInstallHelp() {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();

    return (
        <div className="pushInstallHelpModal" role="dialog" aria-modal="true" aria-label={t("notifications.iosHelpTitle")}>
            <div className="pushInstallHelpTitle">{t("notifications.iosHelpTitle")}</div>
            <p>{t("notifications.iosHelpDescription")}</p>
            <div className="pushInstallHelpSteps">
                <div><Share2 size={22}/><span>{t("notifications.iosStep1")}</span></div>
                <div><Smartphone size={22}/><span>{t("notifications.iosStep2")}</span></div>
                <div><Bell size={22}/><span>{t("notifications.iosStep3")}</span></div>
            </div>
            <button type="button" onClick={() => setBlackout({ seted: false })}>{t("notifications.iosHelpDone")}</button>
        </div>
    );
}
