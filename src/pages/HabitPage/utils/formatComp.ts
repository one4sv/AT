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

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `Выполнено вчера в ${timeStr}`;
  }

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const dateStr = date.toLocaleDateString("ru-RU", options);
  return `Выполнено ${dateStr} в ${timeStr}`;
}
