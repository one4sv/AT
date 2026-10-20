import { useCallback, useEffect, useRef, useState } from "react";
import { CircleNotchIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "../../../components/hooks/AuthHook";
import "../scss/bodyMail.scss";

export default function BodyMail() {
    const { response, checkCode } = useAuth();
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

    if (response.success === false) return null;

    return (
        <div className="landingFormWrapper">
            <div className="landingFormEmail">
                <div className="emailCodeWrapper">
                    <h2 className="emailSendedText">Введите код из письма</h2>
                    <p className="landingEmailHint">Шестизначный код подтверждения отправлен на <strong>{email}</strong></p>
                    <div className="codeWrapper" onClick={() => codeRef.current?.focus()}>
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
                    </div>
                    <div id="confirmation-status" aria-live="polite">
                        {loadingCode ? (
                            <span className="inpExtraSpan loading"><CircleNotchIcon weight="bold"/> Проверяем код</span>
                        ) : validCode === false ? (
                            <span className="inpExtraSpan invalid"><XIcon weight="bold"/> Неверный код. Попробуйте ещё раз.</span>
                        ) : null}
                    </div>
                </div>
                <p className="landingEmailHint">Если письма нет, проверьте папку «Спам».</p>
            </div>
        </div>
    );
}
