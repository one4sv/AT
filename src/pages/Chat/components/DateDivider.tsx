import { isSameDay } from "../utils/isSameDay";

export default function DateDivider({currDate, notop}:{currDate:Date, notop?:boolean}) {

    const formatDateLabel = (d: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (isSameDay(d, today)) return "сегодня";
        if (isSameDay(d, yesterday)) return "вчера";
        return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    }
    return (
        <div className="dateDivider" style={{ top:notop ? "0vh" : "2vh" }}>{formatDateLabel(currDate)}</div>
    )
}