import { useEffect, useState } from "react";
import "../../scss/Notification.scss";
import { useNote } from "../hooks/NoteHook";
import { useTranslation } from "react-i18next";
import { Bell, CircleCheck, CircleX, InfoIcon, Settings } from "lucide-react";

function Notification() {
    const { display, type, txt, id, setDisplay, settingNotice, clearSettingNotice } = useNote();
    const { t } = useTranslation("settings");
    const [animateClass, setAnimateClass] = useState("");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (display) {
            setVisible(true);
            setAnimateClass("notificationActive");
        } else {
            setAnimateClass("notificationHide");
            const timeout = setTimeout(() => setVisible(false), 500);
            return () => clearTimeout(timeout);
        }
    }, [id, display]);

    return <>
        {settingNotice && <div className="settingAppliedNotification notificationActive" role="status">
            <span className="settingAppliedIcon">{settingNotice.icon ?? <Settings size={24}/>}</span>
            <div className="settingAppliedText"><strong>{settingNotice.title}</strong><span>{settingNotice.detail}</span></div>
            <button type="button" onClick={() => { settingNotice.undo(); clearSettingNotice(); }}>{t("sharing.undo")}</button>
        </div>}
        {visible && !settingNotice && <div
            className={`notification ${animateClass} ${type}`}
            onClick={() => setDisplay(false)}
        >
            <span
                className="notificationHead"
            >
                {type === 'error' && <CircleX size={22}/>}
                {type === 'success' && <CircleCheck size={22}/>}
                {type === 'note' && <Bell size={22}/>}
                {type === 'info' && <InfoIcon size={22}/>}
                {/* {type === "success" ? "Успешно!" : type === "info" ? "Уведомление" : "Ошибка!"} */}
            </span>
            <span className="notificationBody">{txt}</span>
        </div>}
    </>;
}

export default Notification;
