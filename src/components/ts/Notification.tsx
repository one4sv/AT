import { useEffect, useState } from "react";
import '../../scss/Notification.scss';
import { useNote } from "../hooks/NoteHook";

function Notification() {
    const { display, type, txt, id, setDisplay } = useNote();
    const [animateClass, setAnimateClass] = useState('');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (display) {
            setVisible(true); // показать
            setAnimateClass('messageActive');
        } else {
            setAnimateClass('messageHide'); // начать анимацию скрытия
            // подождать завершения анимации и скрыть полностью
            const timeout = setTimeout(() => {
                setVisible(false);
            }, 300); // <-- это длительность анимации в ms (должна совпадать с CSS)

            return () => clearTimeout(timeout);
        }
    }, [id, display]);

    if (!visible) return null;

    return (
        <div
            id="notification"
            className={`notification ${
                type === 'success' ? 'notificationUpdated' : type === 'error' ? 'notificationError' : ''
            } ${animateClass}`}
            onClick={() => setDisplay(false)}
        >
            <p
                id="notificationHead"
                className={type === 'success' ? 'notificationHeadUpdated' : type === 'error' ? 'notificationHeadError' : ''}
            >
                {type === 'success' ? 'Успешно!' : type === 'error' ? 'Ошибка!' : ''}
            </p>
            <p
                id="messBody"
                className={type === 'success' ? 'notificationBodyUpdated' : type === 'error' ? 'notificationBodyError' : ''}
            >
                {txt}
            </p>
        </div>
    );
}


export default Notification;