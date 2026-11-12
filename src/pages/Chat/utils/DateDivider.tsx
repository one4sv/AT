import { dateInAppZone, shiftCalendarDay, todayStrFunc } from "../../../components/ts/utils/dateToStr";
import { useTranslation } from "react-i18next";
import { formatAppDate } from "../../../components/ts/utils/dateToStr";

export default function DateDivider({currDate, notop}:{currDate:Date, notop?:boolean}) {
    const { t } = useTranslation("common");

    const formatDateLabel = (d: Date) => {
        const today = todayStrFunc();
        if (dateInAppZone(d) === today) return t("chatUi.today");
        if (dateInAppZone(d) === shiftCalendarDay(today, -1)) return t("chatUi.yesterdayShort");
        return formatAppDate(d, { day: "numeric", month: "long" });
    }
    return (
        <div className="dateDivider" style={{ top:notop ? "0vh" : "1vh" }}>{formatDateLabel(currDate)}</div>
    )
}