import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCodeIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { useUser } from "../components/hooks/UserHook";
import { api } from "../components/ts/api";

export default function QrApprove() {
    const { user, initialLoading } = useUser();
    const navigate = useNavigate();
    const [claim] = useState(() => window.location.hash.slice(1));
    const [request, setRequest] = useState<{ label: string; code: string } | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (initialLoading) return;
        if (!/^[A-Za-z0-9_-]{43}$/.test(claim)) { setError("Некорректный QR-код"); return; }
        if (!user.id) { sessionStorage.setItem("at-pending-qr", claim); navigate("/sign", { replace: true }); return; }
        sessionStorage.removeItem("at-pending-qr");
        const controller = new AbortController();
        api.post("auth/qr/inspect", { claim }, { signal: controller.signal }).then(res => setRequest(res.data)).catch(() => { if (!controller.signal.aborted) setError("QR-код уже использован или истёк. Обновите его на втором устройстве."); });
        return () => controller.abort();
    }, [claim, user.id, initialLoading, navigate]);
    return <div className="statusPage"><section className="statusCard">
        {done ? <CheckCircleIcon size={56} /> : <QrCodeIcon size={56} />}
        <h1>{done ? "Вход подтверждён" : "Войти на другом устройстве?"}</h1>
        {done ? <p>Теперь можно вернуться к другому устройству.</p> : error ? <p role="alert">{error}</p> : request ? <>
            <p>Аккаунт: <strong>{user.username || user.nick}</strong></p>
            <p>Сверьте код на обоих экранах: <strong>{request.code}</strong></p>
            <p style={{ overflowWrap: "anywhere", fontSize: 12 }}>{request.label}</p>
            <p>Подтверждайте только вход, который вы начали сами.</p>
            <button disabled={busy} onClick={async () => { setBusy(true); try { await api.post("auth/qr/approve", { claim, code: request.code }); setDone(true); } catch { setError("Не удалось подтвердить вход. Создайте новый QR-код."); } finally { setBusy(false); } }}>{busy ? "Подтверждаем…" : "Подтвердить вход"}</button>
        </> : <p role="status">Проверяем запрос…</p>}
        <button onClick={() => { sessionStorage.removeItem("at-pending-qr"); navigate("/", { replace: true }); }}>{done ? "Готово" : "Отмена"}</button>
    </section></div>;
}
