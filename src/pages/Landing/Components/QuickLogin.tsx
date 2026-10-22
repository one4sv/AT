import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../../components/ts/api";
import { useUser } from "../../../components/hooks/UserHook";

type Challenge = { id: string; claim: string; code: string; expires_at: string };
export default function QuickLogin() {
    const { refetchUser } = useUser();
    const [account, setAccount] = useState<{ nick: string; username: string } | null>(null);
    const [qr, setQr] = useState<Challenge | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [expired, setExpired] = useState(false);
    const [seconds, setSeconds] = useState(120);
    useEffect(() => {
        const controller = new AbortController();
        api.get("auth/device", { signal: controller.signal }).then(res => setAccount(res.data.account)).catch(() => {});
        return () => controller.abort();
    }, []);
    useEffect(() => {
        if (!qr) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        const poll = async () => {
            if (Date.now() >= Date.parse(qr.expires_at)) { setExpired(true); return; }
            try {
                const res = await api.get(`auth/qr/${qr.id}`, { signal: controller.signal });
                if (res.data.approved) {
                    await api.post("auth/qr/consume", { id: qr.id }, { signal: controller.signal });
                    setQr(null);
                    await refetchUser();
                    return;
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                setError("Код недоступен. Создайте новый QR-код."); setExpired(true); return;
            }
            if (!controller.signal.aborted) timer = setTimeout(poll, 1800);
        };
        timer = setTimeout(poll, 1800);
        const countdown = setInterval(() => setSeconds(Math.max(0, Math.ceil((Date.parse(qr.expires_at) - Date.now()) / 1000))), 1000);
        return () => { controller.abort(); clearTimeout(timer); clearInterval(countdown); };
    }, [qr, refetchUser]);
    const run = async (action: () => Promise<void>) => {
        setBusy(true); setError("");
        try { await action(); } catch { setError("Не удалось выполнить вход. Повторите попытку или используйте пароль."); } finally { setBusy(false); }
    };
    return <div className="quickLogin">
        {account && <>
            <button type="button" disabled={busy} onClick={() => run(async () => { await api.post("auth/device/login"); await refetchUser(); })}>Войти как {account.username || account.nick}</button>
            <button type="button" className="quickForget" disabled={busy} onClick={() => run(async () => { await api.delete("auth/device"); setAccount(null); })}>Убрать быстрый вход на этом устройстве</button>
        </>}
        <button type="button" disabled={busy} onClick={() => run(async () => { const res = await api.post("auth/qr"); setQr(res.data); setSeconds(120); setExpired(false); })}>{qr ? "Обновить QR-код" : "Войти по QR-коду"}</button>
        {qr && <div className="qrCard">
            {!expired && <QRCodeSVG value={`${window.location.origin}/auth/qr#${qr.claim}`} size={180} level="M" marginSize={0} />}
            <p>{expired ? "Срок действия QR-кода истёк" : `Код подтверждения: ${qr.code} · ${seconds} с`}</p>
            <p>Откройте камеру на устройстве, где вы уже вошли в АТ, и подтвердите вход.</p>
            <button type="button" onClick={() => setQr(null)}>Закрыть QR-код</button>
        </div>}
        {error && <span className="quickError" role="alert">{error}</span>}
    </div>;
}
