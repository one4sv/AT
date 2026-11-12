import i18n from "../../../i18n/i18n";
import { dateInAppZone, formatAppDate, formatAppTime, shiftCalendarDay, todayStrFunc } from "./dateToStr";
export default function formatLastOnline(lastOnline: string | null | undefined) {
  if (!lastOnline) return "";

  const lastDate = new Date(lastOnline);
  if (isNaN(lastDate.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return i18n.t("chatUi.justNow", { ns: "common" });
  if (diffMin < 2) return i18n.t("chatUi.minute", { ns: "common" });
  if (diffMin < 60) return i18n.t("chatUi.minutes", { ns: "common", count: diffMin });
  if (diffHour < 2) return i18n.t("chatUi.hour", { ns: "common" });
  if (diffHour < 5) return i18n.t("chatUi.hours", { ns: "common", count: diffHour });
  if (diffHour < 24) return i18n.t("chatUi.hours", { ns: "common", count: diffHour });

  const yesterday = shiftCalendarDay(todayStrFunc(), -1);

  const timeStr = formatAppTime(lastDate);

  if (dateInAppZone(lastDate) === yesterday) {
    return i18n.t("chatUi.yesterday", { ns: "common", time: timeStr });
  }

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const dateStr = formatAppDate(lastDate, options);
  return i18n.t("chatUi.lastSeen", { ns: "common", date: dateStr, time: timeStr });
}
