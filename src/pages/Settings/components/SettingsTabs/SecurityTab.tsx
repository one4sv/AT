import { useUser } from "../../../../components/hooks/UserHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { api } from "../../../../components/ts/api";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import HighlightText from "../../../../components/ts/HighlightText";
import { ShieldCheckIcon } from "@phosphor-icons/react";

import SectionArt from "../../../../components/ts/SectionArt";

export default function SecurityTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const { twoAuth } = useSettings();
    const [pending, setPending] = useState(false);
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [unusedCodes, setUnusedCodes] = useState<number | null>(null);
    const [error, setError] = useState("");

    const askAuth = async (mode: "toggle" | "backup") => {
        if (busy || twoAuth === null || !password) return;
        setBusy(true);
        setError("");
        try {
            const res = await api.post("askauth", { password, mode });
            if (!res.data?.success) throw new Error("two-factor");
            setPassword("");
            setPending(true);
        } catch (reason) {
            setError(axios.isAxiosError(reason) ? reason.response?.data?.error || t("security.requestError") :
                t("security.requestError"));
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        void api.get("askauth").then(response => {
            if (!mounted) return;
            if (response.data?.success) {
                setPending(Boolean(response.data.isAsked));
                setUnusedCodes(response.data.unusedRecoveryCodes);
            }
        }).catch(() => {
            if (mounted) setError(t("security.statusError"));
        });
        return () => { mounted = false; };
    }, [t]);

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="security"/>}
            <div className="settingInnerDiv twoFactorSettingsCard" data-setting-id="twoAuth">
                <div className="twoFactorHeading">
                    <span className="twoFactorIcon"><ShieldCheckIcon size={24}/></span>
                    <div className="twoFactorHeadingText">
                        <div className="settingHeader">
                            <HighlightText text={t("security.twoFactor")} search={search}/>
                        </div>
                        <span className="settingHint">
                    {pending
                        ? t("security.sentHint", { email: user.mail })
                        : t("security.confirmHint", { email: user.mail })}
                        </span>
                    </div>
                </div>
                {!pending && <div className="settingInnerList twoFactorForm">
                    <div className="settingsInputDiv">
                        <label htmlFor="twoFactorPassword" className="settingsLabel">{t("security.currentPassword")}</label>
                        <div className="settingInputInnerList">
                            <input id="twoFactorPassword" className="extraInfoInput" type="password"
                                autoComplete="current-password" value={password}
                                onChange={event => setPassword(event.target.value)}/>
                        </div>
                    </div>
                    <button type="button" className="safetyButt" disabled={busy || !password || twoAuth === null}
                        onClick={() => void askAuth("toggle")}>
                        {twoAuth ? t("security.disable") : t("security.enable")}
                    </button>
                    {twoAuth && <>
                        <span className="settingHint">{t("security.backupCount", { count: unusedCodes ?? 0 })}</span>
                        <button type="button" className="safetyButt" disabled={busy || !password}
                            onClick={() => void askAuth("backup")}>{t("security.regenerateBackup")}</button>
                        <span className="settingHint">{t("security.regenerateWarning")}</span>
                    </>}
                </div>}
                {pending && <span className="settingHint">{t("security.emailLinkHint")}</span>}
                {error && <span className="settingHint" role="alert">{error}</span>}
            </div>
            <div className="settingInnerDiv" data-setting-id="changePassword">
                <div className="settingHeader">
                    <HighlightText text={t("security.changePassword")} search={search}/>
                    <Link className="securityAction" to="/settings/password">{t("security.open")}</Link>
                </div>
                <span className="settingHint">{t("security.passwordHint")}</span>
            </div>
            <div className="settingInnerDiv" data-setting-id="devices">
                <div className="settingHeader">
                    <HighlightText text={t("security.devices")} search={search}/>
                    <Link className="securityAction" to="/settings/devices">{t("security.open")}</Link>
                </div>
                <span className="settingHint">{t("security.devicesHint")}</span>
            </div>
        </div>
    );
}