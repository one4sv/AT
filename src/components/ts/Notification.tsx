import { useEffect, useState } from "react";
import "../../scss/Notification.scss";
import { useNote } from "../hooks/NoteHook";
import { Bell, CircleCheck, CircleX } from "lucide-react";

function Notification() {
    const { display, type, txt, id, setDisplay } = useNote();
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

    if (!visible) return null;

    return (
        <div
            className={`notification ${animateClass} ${type}`}
            onClick={() => setDisplay(false)}
        >
            <span
                className="notificationHead"
            >
                {type === 'error' && <CircleX size={22}/>}
                {type === 'success' && <CircleCheck size={22}/>}
                {type === 'note' && <Bell size={22}/>}
                {/* {type === "success" ? "Успешно!" : type === "info" ? "Уведомление" : "Ошибка!"} */}
            </span>
            <span className="notificationBody">{txt}</span>
        </div>
    );
}

export default Notification;
