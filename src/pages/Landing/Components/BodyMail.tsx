import { useCallback, useEffect, useRef, useState } from "react";
import { CircleNotchIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "../../../components/hooks/AuthHook";
import { useUser } from "../../../components/hooks/UserHook";
import { useTranslation } from "react-i18next";
import { api } from "../../../components/ts/api";
import axios from "axios";
import "../scss/bodyMail.scss";

export default function BodyMail() {
    const { response, checkCode } = useAuth();
    const { refetchUser } = useUser();
    const { t } = useTranslation("settings");
    const [backupMode, setBackupMode] = useState(false);
    const [backupPassword, setBackupPassword] = useState("");
    const [backupCode, setBackupCode] = useState("");
    const [backupError, setBackupError] = useState("");
    const [backupBusy, setBackupBusy] = useState(false);
    const isTwoAuth = response.success === true && response.form === "auth" && response.two_auth;
    const email = "email" in response ? response.email : "";
    const [code, setCode] = useState("");
    const [loadingCode, setLoadingCode] = useState(false);
    const [validCode, setValidCode] = useState<boolean | null>(null);
    const codeRef = useRef<HTMLInputElement>(null);
    const codeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const codeAbort = useRef<AbortController | null>(null);
    const requestId = useRef(0);
    const [focused, setFocused] = useState(false);

    const cancelPending = useCallback(() => {
        requestId.current++;
        if (codeTimeout.current) clearTimeout(codeTimeout.current);
        codeTimeout.current = null;
        codeAbort.current?.abort();
        codeAbort.current = null;
        setLoadingCode(false);
    }, []);

    useEffect(() => {
        return () => {
            requestId.current++;
            if (codeTimeout.current) clearTimeout(codeTimeout.current);
            codeAbort.current?.abort();
        };
    }, []);

    useEffect(() => {
        setCode("");
        setValidCode(null);
        cancelPending();
    }, [email, cancelPending]);

    const updateCode = (value: string) => {
        const next = value.replace(/\D/g, "").slice(0, 6);
        cancelPending();
        setCode(next);
        setValidCode(null);
        if (next.length !== 6 || !email) return;
        const id = requestId.current;
        codeTimeout.current = setTimeout(async () => {
            const controller = new AbortController();
            codeAbort.current = controller;
            setLoadingCode(true);
            try {
                const result = await checkCode({ code: next, email, signal: controller.signal });
                if (requestId.current !== id || controller.signal.aborted) return;
                setValidCode(Boolean(result.success));
            } catch (err) {
                if (requestId.current !== id || controller.signal.aborted) return;
                setValidCode(false);
                console.error("Ошибка подтверждения кода:", err);
            } finally {
                if (requestId.current === id && !controller.signal.aborted) setLoadingCode(false);
            }
        }, 400);
    };

    const loginWithBackup = async () => {
        if (!isTwoAuth || backupBusy) return;
        setBackupBusy(true);
        setBackupError("");
        try {
            const result = await api.post("auth/2fa/recovery-login", {
                email, password: backupPassword, recoveryCode: backupCode
            });
            if (!result.data?.success) throw new Error("backup");
            setBackupPassword("");
            setBackupCode("");
            await refetchUser();
        } catch (reason) {
            setBackupError(axios.isAxiosError(reason) ? reason.response?.data?.error || t("security.backupError") :
                t("security.backupError"));
        } finally {
            setBackupBusy(false);
        }
    };

    if (response.success === false) return null;

    return (
        <div className="landingFormWrapper">
            <div className="landingFormEmail">
                <div className="emailCodeWrapper">
                    <h2 className="emailSendedText">Введите код из письма</h2>
                    <p className="landingEmailHint">Шестизначный код подтверждения отправлен на <strong>{email}</strong></p>
                    {!backupMode && <div className="codeWrapper" onClick={() => codeRef.current?.focus()}>
                        <input
                            ref={codeRef}
                            id="confirmation-code"
                            aria-label="Шестизначный код подтверждения"
                            aria-invalid={validCode === false}
                            aria-describedby="confirmation-status"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={code}
                            onChange={e => updateCode(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            className="hiddenCodeInput"
                        />
                        {Array.from({ length: 6 }, (_, index) => (
                            <div
                                key={index}
                                aria-hidden="true"
                                className={`codeCell ${focused && index === Math.min(code.length, 5) ? "active" : ""} ${validCode === false ? "invalid" : ""}`}
                            >{code[index] || ""}</div>
                        ))}
                    </div>}
                    {!backupMode && <div id="confirmation-status" aria-live="polite">
                        {loadingCode ? (
                            <span className="inpExtraSpan loading"><CircleNotchIcon weight="bold"/> Проверяем код</span>
                        ) : validCode === false ? (
                            <span className="inpExtraSpan invalid"><XIcon weight="bold"/> Неверный код. Попробуйте ещё раз.</span>
                        ) : null}
                    </div>}
                    {isTwoAuth && <>
                        {backupMode && <form className="settingInnerList" onSubmit={event => { event.preventDefault(); void loginWithBackup(); }}>
                            <label htmlFor="twoFactorBackupPassword">{t("security.backupPassword")}</label>
                            <input id="twoFactorBackupPassword" className="extraInfoInput" type="password"
                                autoComplete="current-password" required value={backupPassword}
                                onChange={event => setBackupPassword(event.target.value)}/>
                            <label htmlFor="twoFactorBackupCode">{t("security.recoveryCode")}</label>
                            <input id="twoFactorBackupCode" className="extraInfoInput" autoComplete="off" required
                                placeholder="ABCD-EFGH-IJKL-MNOP" value={backupCode}
                                onChange={event => setBackupCode(event.target.value.toUpperCase())}/>
                            <button className="safetyButt" type="submit" disabled={backupBusy || !backupPassword || !backupCode}>
                                {t("security.backupLogin")}
                            </button>
                            {backupError && <span role="alert" className="inpExtraSpan invalid">{backupError}</span>}
                        </form>}
                        <button type="button" className="landingEmailHint" onClick={() => setBackupMode(value => !value)}>
                            {t(backupMode ? "security.useEmailCode" : "security.useBackup")}
                        </button>
                    </>}
                </div>
                {!backupMode && <p className="landingEmailHint">Если письма нет, проверьте папку «Спам».</p>}
            </div>
        </div>
    );
}
