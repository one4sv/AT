import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axios from "axios";
import { api } from "../../components/ts/api";
import { Background } from "../../components/ts/utils/background";
import "./AccountDeletion.scss";

export default function TwoFactorConfirm() {
    const { t } = useTranslation("settings");
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token") || "";
    const action = params.get("action") || "";
    const [codes, setCodes] = useState<string[] | null>(null);
    const [complete, setComplete] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const confirm = async () => {
        if (busy || complete) return;
        setBusy(true);
        setError("");
        try {
            const response = await api.post("askauth/confirm", { token, action });
            if (!response.data?.success) throw new Error("two-factor");
            setComplete(true);
            setEnabled(Boolean(response.data.enabled));
            setCodes(Array.isArray(response.data.backupCodes) ? response.data.backupCodes : []);
            window.history.replaceState(null, "", "/settings/2fa");
        } catch (reason) {
            setError(axios.isAxiosError(reason) ? reason.response?.data?.error || t("security.requestError") :
                t("security.requestError"));
            setBusy(false);
        }
    };

    return (
        <main className="accountDeletionPage">
            <Background/>
            <section className="accountDeletionCard">
                <h1>{t("security.confirmTwoFactor")}</h1>
                {!complete ? <>
                    <p>{t("security.confirmAction")}</p>
                    <button type="button" disabled={busy || !token || !["two_factor", "two_factor_backup"].includes(action)}
                        onClick={() => void confirm()}>{t("security.confirmButton")}</button>
                    {error && <p className="accountDeletionError" role="alert">{error}</p>}
                </> : <>
                    <p>{t(enabled ? "security.confirmEnabled" : "security.confirmDisabled")}</p>
                    {enabled && codes && codes.length > 0 && <>
                        <p>{t("security.backupNotice")}</p>
                        <div className="accountDeletionCounter">
                            {codes.map(code => <code key={code}>{code}</code>)}
                        </div>
                        <button type="button" onClick={() => void navigator.clipboard.writeText(codes.join("\n"))}>
                            {t("security.copyBackup")}
                        </button>
                    </>}
                    <Link to="/sign">{t("security.signInAgain")}</Link>
                </>}
            </section>
        </main>
    );
}