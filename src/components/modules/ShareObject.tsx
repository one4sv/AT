import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useContacts } from "../hooks/ContactsHook";
import { useSendMess } from "../hooks/SendMessHook";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";
import { fetchWallpaperFile, fitWallpaperForChat } from "../ts/utils/fetchWallpaperFile";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
import "./scss/ShareObject.scss";
export default function ShareObject() {
    const { t } = useTranslation("settings");
    const { t: common } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const { list } = useContacts();
    const { sendMess } = useSendMess();
    const { showNotification } = useNote();
    const { user } = useUser();
    const userId = useRef(user.id);
    userId.current = user.id;
    const [query, setQuery] = useState("");
    const [targetId, setTargetId] = useState("");
    const [busy, setBusy] = useState(false);
    const object = blackout.shareObject;
    const target = list.find(item => item.id === targetId && !item.is_blocked);
    const contacts = list.filter(item => !item.is_blocked && (item.name + " " + item.nick + " " + (item.id === user.id ? common("chatUi.favorites") : "")).toLowerCase().includes(query.toLowerCase()));
    const send = async () => {
        if (!object || !target || busy) return;
        const owner = user.id;
        setBusy(true);
        try {
            const files = object.asset && object.bucket ? [await fitWallpaperForChat(await fetchWallpaperFile(object.asset, object.bucket))] : [];
            if (owner !== userId.current) return;
            const ok = await sendMess(target.is_group ? { id: target.id } : { nick: target.nick }, object.url, files);
            if (ok) { showNotification("success", t("sharing.objectSent")); setBlackout({seted:false}); }
        } catch { showNotification("error", t("backgroundLibrary.shareUnavailable")); }
        finally { setBusy(false); }
    };
    return <ConfirmActionLayout title={t("sharing.shareObject")} actions={<>
        <button type="button" disabled={busy} onClick={() => setBlackout({seted:false})}>{common("chatUi.quickCommands.close")}</button>
        <button type="button" className="approve" disabled={!target || busy} onClick={() => void send()}>{t("sharing.sendObject")}</button>
    </>}>
        {object?.name && <div className="shareObjectName">{object.name}</div>}
        <input className="shareObjectSearch" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("quickFilters.search")}/>
        <div className="shareObjectContacts">{contacts.map(item => <button key={item.id} type="button" className={targetId === item.id ? "active" : ""} disabled={busy} onClick={() => setTargetId(item.id)}>
            {item.avatar_url && item.id !== user.id && <img src={item.avatar_url} alt=""/>}
            <span>{item.id === user.id ? common("chatUi.favorites") : item.name || item.nick}</span>
        </button>)}</div>
    </ConfirmActionLayout>;
}
