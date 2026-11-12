import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axios from "axios";
import { api } from "../../components/ts/api";
import { Background } from "../../components/ts/utils/background";
import "./scss/AccountDeletion.scss";

type PendingDeletion = { email: string; deadline: string };

const pendingFromSession = (): PendingDeletion | null => {
    try {
        const data = JSON.parse(sessionStorage.getItem("at-pending-deletion") || "null");
        if (!data || typeof data.email !== "string" || typeof data.deadline !== "string") return null;
        return data;
    } catch {
        return null;
    }
};

export default function AccountDeletion() {
    const { t } = useTranslation("settings");
    const [pending] = useState(pendingFromSession);
    const [now, setNow] = useState(Date.now);
    const [email, setEmail] = useState(pending?.email || "");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, []);

    const remaining = Math.max(0, new Date(pending?.deadline || 0).getTime() - now);
    const minutes = Math.ceil(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    const days = Math.ceil(remaining / 86400000);
    const left = remaining <= 0 ? t("pending.expired") :
        remaining >= 86400000 ? t("pending.days", { count: days }) :
        remaining >= 3 * 3600000 ? t("pending.hours", { count: Math.ceil(remaining / 3600000) }) :
        remaining >= 3600000 ? t("pending.hours", { count: hours }) + " " + t("pending.minutes", { count: restMinutes }) :
        t("pending.minutes", { count: minutes });

    const errorMessage = (reason: unknown) => axios.isAxiosError(reason) ?
        (reason.response?.data?.error || t("pending.error")) : t("pending.error");

    const requestRecovery = async () => {
        if (busy || remaining <= 0) return;
        setBusy(true);
        setError("");
        try {
            const response = await api.post("auth/account/recover/request", { email: email.trim(), password });
            if (!response.data?.success) throw new Error("recovery");
            setSent(true);
        } catch (reason) {
            setError(errorMessage(reason));
        } finally {
            setBusy(false);
        }
    };

    const recover = async () => {
        if (busy || remaining <= 0) return;
        setBusy(true);
        setError("");
        try {
            const response = await api.post("auth/account/recover/confirm", {
                email: email.trim(), password, code: code.trim()
            });
            if (!response.data?.success) throw new Error("recovery");
            sessionStorage.removeItem("at-pending-deletion");
            window.location.assign("/");
        } catch (reason) {
            setError(errorMessage(reason));
            setBusy(false);
        }
    };

    return (
        <main className="accountDeletionPage">
            <Background/>
            <section className="accountDeletionCard">
                <h1>{t("pending.title")}</h1>
                <p>{pending ? t("pending.description") : t("pending.missing")}</p>
                {pending && <>
                    <div className="accountDeletionCounter" role="timer">
                        <span>{t("pending.remaining")}</span>
                        <strong>{left}</strong>
                    </div>
                    {remaining > 0 && <>
                        <form onSubmit={event => { event.preventDefault(); void (sent ? recover() : requestRecovery()); }}>
                            <label htmlFor="deletionRecoveryEmail">{t("pending.email")}</label>
                            <input id="deletionRecoveryEmail" type="email" autoComplete="email" required value={email}
                                onChange={event => setEmail(event.target.value)}/>
                            <label htmlFor="deletionRecoveryPassword">{t("pending.password")}</label>
                            <input id="deletionRecoveryPassword" type="password" autoComplete="current-password" required value={password}
                                onChange={event => setPassword(event.target.value)}/>
                            {sent && <>
                                <p>{t("pending.sent", { email })}</p>
                                <label htmlFor="deletionRecoveryCode">{t("pending.code")}</label>
                                <input id="deletionRecoveryCode" inputMode="numeric" autoComplete="one-time-code"
                                    maxLength={6} required value={code}
                                    onChange={event => setCode(event.target.value.replace(/\D/g, ""))}/>
                            </>}
                            <button type="submit" disabled={busy || !email || !password || (sent && code.length !== 6)}>
                                {t(sent ? "pending.confirm" : "pending.send")}
                            </button>
                            {error && <p className="accountDeletionError" role="alert">{error}</p>}
                        </form>
                    </>}
                </>}
                <Link to="/sign">{t("pending.returnToLogin")}</Link>
            </section>
        </main>
    );
}