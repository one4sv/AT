export default function formatCreated(created: string | null | undefined) {
  if (!created) return "";

  const lastDate = new Date(created);
  if (isNaN(lastDate.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "Только что";
  if (diffMin < 2) return "Минуту назад";
  if (diffMin < 60) return `${diffMin} минут назад`;
  if (diffHour < 2) return "Час назад";
  if (diffHour < 5) return `${diffHour} часа назад`;
  if (diffHour < 24) return `${diffHour} часов назад`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const timeStr = lastDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (
    lastDate.getDate() === yesterday.getDate() &&
    lastDate.getMonth() === yesterday.getMonth() &&
    lastDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Вчера в ${timeStr}`;
  }

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const dateStr = lastDate.toLocaleDateString("ru-RU", options);
  return `${dateStr} в ${timeStr}`;
}
