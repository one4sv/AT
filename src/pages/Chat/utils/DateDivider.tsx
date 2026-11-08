import { isSameDay } from "./funcs/isSameDay";
import { useTranslation } from "react-i18next";
import { formatAppDate } from "../../../components/ts/utils/dateToStr";

export default function DateDivider({currDate, notop}:{currDate:Date, notop?:boolean}) {
    const { t } = useTranslation("common");

    const formatDateLabel = (d: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (isSameDay(d, today)) return t("chatUi.today");
        if (isSameDay(d, yesterday)) return t("chatUi.yesterdayShort");
        return formatAppDate(d, { day: "numeric", month: "long" });
    }
    return (
        <div className="dateDivider" style={{ top:notop ? "0vh" : "1vh" }}>{formatDateLabel(currDate)}</div>
    )
}