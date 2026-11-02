import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CookieIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { api } from "./api";
import {
    cookieConsentEvent,
    cookieConsentOpenEvent,
    getCookiePreference,
    saveCookiePreference,
    type CookiePreference
} from "./utils/cookieConsent";
import "../../scss/CookieConsent.scss";

export default function CookieConsent() {
    const { t } = useTranslation("common");
    const [visible, setVisible] = useState(() => getCookiePreference() === null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const open = () => {
            setError("");
            setVisible(true);
        };
        const sync = () => setVisible(getCookiePreference() === null);
        window.addEventListener(cookieConsentOpenEvent, open);
        window.addEventListener(cookieConsentEvent, sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener(cookieConsentOpenEvent, open);
            window.removeEventListener(cookieConsentEvent, sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    const choose = async (value: CookiePreference) => {
        if (saving) return;
        setSaving(true);
        setError("");

        try {
            if (value === "necessary") {
                // Revoke any earlier quick-login token before saving an opt-out.
                await api.delete("/auth/device");
                sessionStorage.removeItem("at-trust-after-login");
            }
            saveCookiePreference(value);
            setVisible(false);
        } catch {
            setError(t("cookieConsent.saveError"));
        } finally {
            setSaving(false);
        }
    };

    if (!visible) return null;

    return (
        <aside className="atCookieBanner" role="region" aria-label={t("cookieConsent.title")}>
            <div className="atCookieIntro">
                <CookieIcon aria-hidden="true" />
                <div className="atCookieDescription">
                    <h2>{t("cookieConsent.title")}</h2>
                    <p>{t("cookieConsent.description")}</p>
                    <p>{t("cookieConsent.optional")}</p>
                    <Link to="/info/policy">{t("cookieConsent.policy")}</Link>
                </div>
            </div>
            {error && <p className="atCookieError" role="alert">{error}</p>}
            <div className="atCookieButtons">
                <button type="button" disabled={saving} onClick={() => void choose("necessary")}>
                    {t("cookieConsent.necessary")}
                </button>
                <button type="button" className="atCookieAllow" disabled={saving} onClick={() => void choose("all")}>
                    {t("cookieConsent.allow")}
                </button>
            </div>
        </aside>
    );
}
