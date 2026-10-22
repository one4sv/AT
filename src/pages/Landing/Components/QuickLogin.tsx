import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../../components/ts/api";
import { useUser } from "../../../components/hooks/UserHook";
type Challenge = {
    id: string;
    claim: string;
    code: string;
    expires_at: string;
};
type Props = {
    active: boolean;
    mode?: "device" | "qr";
    onQr?: () => void;
    onBack?: () => void;
};
export default function QuickLogin({
    active,
    mode = "device",
    onQr,
    onBack
}: Props) {
    const { t } = useTranslation("sign");
    const { refetchUser } = useUser();
    const [account, setAccount] = useState<{
        nick: string;
        username: string;
    } | null>(null);
    const [qr, setQr] = useState<Challenge | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [expired, setExpired] = useState(false);
    const [seconds, setSeconds] = useState(120);
    const [generation, setGeneration] = useState(0);

    useEffect(
        () => {
            if (mode !== "device") return;
            const controller = new AbortController();
            api.get("auth/device", {
                signal: controller.signal
            }).then(
                res => setAccount(res.data.account)
            ).catch(
                () => { }
            );
            return () => controller.abort();
        },
        [mode]
    );

    useEffect(
        () => {
            if (mode !== "qr" || !active) {
                setQr(null);
                return;
            }
            const controller = new AbortController();
            setBusy(true);
            setError("");
            setQr(null);
            setExpired(false);
            api.post("auth/qr", {}, {
                signal: controller.signal
            }).then(
                res => {
                    if (controller.signal.aborted) return;
                    setQr(res.data);
                    setSeconds(Math.max(0, Math.ceil((Date.parse(res.data.expires_at) - Date.now()) / 1000)));
                }
            ).catch(
                () => {
                    if (!controller.signal.aborted) setError("quick.codeUnavailable");
                }
            ).finally(
                () => {
                    if (!controller.signal.aborted) setBusy(false);
                }
            );
            return () => controller.abort();
        },
        [active, mode, generation]
    );

    useEffect(
        () => {
            if (!qr || !active || mode !== "qr") return;
            const controller = new AbortController();
            let timer: ReturnType<typeof setTimeout>;
            const poll = async () => {
                if (Date.now() >= Date.parse(qr.expires_at)) {
                    setExpired(true);
                    return;
                }
                try {
                    const res = await api.get(
                        `auth/qr/${qr.id}`,
                        {
                            signal: controller.signal
                        }
                    );
                    if (res.data.approved) {
                        await api.post(
                            "auth/qr/consume",
                            {
                                id: qr.id
                            },
                            {
                                signal: controller.signal
                            }
                        );
                        setQr(null);
                        await refetchUser();
                        return;
                    }
                } catch {
                    if (controller.signal.aborted) return;
                    setError("quick.codeUnavailable");
                    setExpired(true);
                    return;
                }
                if (!controller.signal.aborted) timer = setTimeout(poll, 1800);
            };
            timer = setTimeout(poll, 1800);
            const countdown = setInterval(
                () => setSeconds(Math.max(0, Math.ceil((Date.parse(qr.expires_at) - Date.now()) / 1000))),
                1000
            );
            return () => {
                controller.abort();
                clearTimeout(timer);
                clearInterval(countdown);
            };
        },
        [qr, active, mode, refetchUser]
    );

    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        setError("");
        try {
            await action();
        } catch {
            setError("quick.failed");
        } finally {
            setBusy(false);
        }
    };
    if (mode === "qr") return (
        <div className="quickLogin quickLoginQr">
            <h2>
                {t("quick.signInQr")}
            </h2>
            <div className="qrCard">
                <div className="qrImage">
                    {busy ? <p role="status">
                        {t("quick.loadingQr")}
                    </p> : qr && !expired ? <QRCodeSVG
                        value={`${window.location.origin}/auth/qr#${qr.claim}`}
                        size={180}
                        level="M"
                        marginSize={0}
                    /> : <p>
                        {t(expired ? "quick.expired" : "quick.codeUnavailable")}
                    </p>}
                </div>
                {qr && !expired && <p>
                    {t(
                        "quick.confirmation",
                        {
                            code: qr.code,
                            seconds
                        }
                    )}
                </p>}
                <p>
                    {t("quick.instructions")}
                </p>
                <button
                    type="button"
                    className="quickQrButton"
                    disabled={busy}
                    onClick={() => setGeneration(n => n + 1)}
                >
                    {t("quick.refreshQr")}
                </button>
                <button type="button" onClick={onBack}>
                    {t("quick.closeQr")}
                </button>
            </div>
            {error && <span className="quickError" role="alert">
                {t(error)}
            </span>}
        </div>
    );

    return (
        <div className="quickLogin">
            {account && <>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(
                        async () => {
                            await api.post("auth/device/login");
                            await refetchUser();
                        }
                    )}
                >
                    {t(
                        "quick.signInAs",
                        {
                            name: account.username || account.nick
                        }
                    )}
                </button>
                <button
                    type="button"
                    className="quickForget"
                    disabled={busy}
                    onClick={() => run(
                        async () => {
                            await api.delete("auth/device");
                            setAccount(null);
                        }
                    )}
                >
                    {t("quick.forget")}
                </button>
            </>}
            <button type="button" className="quickQrButton" disabled={busy} onClick={onQr}>
                {t("quick.signInQr")}
            </button>
            {error && <span className="quickError" role="alert">
                {t(error)}
            </span>}
        </div>
    );
}
