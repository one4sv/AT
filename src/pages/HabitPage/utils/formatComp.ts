import { dateInAppZone, formatAppDate, formatAppTime, shiftCalendarDay, todayStrFunc } from "../../../components/ts/utils/dateToStr";
export default function formatComp(created: Date | string | null | undefined) {
  if (!created) return "";

  const date = typeof created === "string" ? new Date(created) : created;

  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "Выполнено только что";
  if (diffMin < 2) return "Выполнено минуту назад";
  if (diffMin < 60) return `Выполнено ${diffMin} минут назад`;
  if (diffHour < 2) return "Выполнено час назад";
  if (diffHour < 5) return `Выполнено ${diffHour} часа назад`;
  if (diffHour < 24) return `Выполнено ${diffHour} часов назад`;

  const yesterday = shiftCalendarDay(todayStrFunc(), -1);

  const timeStr = formatAppTime(date);

  if (dateInAppZone(date) === yesterday) {
    return `Выполнено вчера в ${timeStr}`;
  }

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const dateStr = formatAppDate(date, options);
  return `Выполнено ${dateStr} в ${timeStr}`;
}
