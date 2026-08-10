import { useUser } from "../../../../components/hooks/UserHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { api } from "../../../../components/ts/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function SecurityTab() {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const { twoAuth } = useSettings();
    const [pending, setPending] = useState<boolean>(false);

    const askAuth = async () => {
        if (twoAuth === null) return;
        const res = await api.post("/askauth");
        if (res.data.success) setPending(true);
    };

    const isAsked = async () => {
        const res = await api.get(`/askauth`);
        if (res.data.isAsked) setPending(true);
    };

    useEffect(() => {
        isAsked();
    }, []);

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader" title="Не кликабельно">
                    {t("security.twoFactor")}
                    <div className={`safetyButt ${pending && "inactive"}`} onClick={() => askAuth()}>
                        {pending
                            ? t("security.sent")
                            : twoAuth
                                ? t("security.disable")
                                : t("security.enable")}
                    </div>
                </div>
                <span className="settingHint">
                    {pending
                        ? t("security.sentHint", { email: user.mail })
                        : t("security.confirmHint", { email: user.mail })}
                </span>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("security.changePassword")}
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("security.devices")}
                </div>
                <div className="settingSpan">{t("security.activeSessions")}</div>
                <div className="settingSpan">{t("security.logoutAll")}</div>
            </div>
        </div>
    );
}