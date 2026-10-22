import { useEffect, useState } from "react";
import { GlobeHemisphereWestIcon, WifiSlashIcon, CloudSlashIcon } from "@phosphor-icons/react";
import { api, getConnectionIssue, type ConnectionIssue } from "./api";

export default function ConnectionStatus({ standalone = false }: { standalone?: boolean }) {
    const [issue, setIssue] = useState<ConnectionIssue>(navigator.onLine ? getConnectionIssue() : "offline");
    const [checking, setChecking] = useState(false);
    useEffect(() => {
        const update = () => setIssue(navigator.onLine ? getConnectionIssue() : "offline");
        const online = () => { void api.get("ping", { timeout: 10000 }).catch(() => {}); };
        window.addEventListener("at-connection", update);
        window.addEventListener("offline", update);
        window.addEventListener("online", online);
        return () => { window.removeEventListener("at-connection", update); window.removeEventListener("offline", update); window.removeEventListener("online", online); };
    }, []);
    if (!issue && !standalone) return null;
    const region = issue === "region";
    const offline = issue === "offline";
    return <div className="statusPage"><section className="statusCard" role="alert" aria-live="polite">
        {region ? <GlobeHemisphereWestIcon size={56} /> : offline ? <WifiSlashIcon size={56} /> : <CloudSlashIcon size={56} />}
        <h1>{region ? "Сервис недоступен в вашем регионе" : offline ? "Нет подключения к интернету" : issue ? "Не удаётся связаться с сервером" : "Соединение восстановлено"}</h1>
        <p>{region ? "Сервер сообщил об ограничении доступа по местоположению." : offline ? "Проверьте Wi-Fi или мобильную сеть. Открытая страница останется на месте." : issue ? "Проверьте соединение или повторите попытку немного позже." : "Можно вернуться в приложение."}</p>
        <button disabled={checking} onClick={async () => { setChecking(true); try { await api.get("ping", { timeout: 10000 }); window.location.reload(); } catch { /* interceptor updates reason */ } finally { setChecking(false); } }}>{checking ? "Проверяем…" : "Повторить подключение"}</button>
    </section></div>;
}
