import { useEffect, useState } from "react";
import "../../scss/Notification.scss";
import { useNote } from "../hooks/NoteHook";

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
            className={`notification ${animateClass}`}
            onClick={() => setDisplay(false)}
        >
            <p
                id="notificationHead"
            >
                {type === "success" ? "Успешно!" : "Ошибка!"}
            </p>
            <p id="notificationBody">{txt}</p>
        </div>
    );
}

export default Notification;
