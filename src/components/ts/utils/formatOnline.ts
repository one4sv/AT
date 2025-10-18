export default function formatLastOnline(lastOnline: string | null | undefined) {
  if (!lastOnline) return "";

  const lastDate = new Date(lastOnline);
  if (isNaN(lastDate.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "В сети только что";
  if (diffMin < 2) return "В сети минуту назад";
  if (diffMin < 60) return `В сети ${diffMin} минут назад`;
  if (diffHour < 2) return "В сети час назад";
  if (diffHour < 5) return `В сети ${diffHour} часа назад`;
  if (diffHour < 24) return `В сети ${diffHour} часов назад`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const timeStr = lastDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (
    lastDate.getDate() === yesterday.getDate() &&
    lastDate.getMonth() === yesterday.getMonth() &&
    lastDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `В сети вчера в ${timeStr}`;
  }

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const dateStr = lastDate.toLocaleDateString("ru-RU", options);
  return `В сети ${dateStr} в ${timeStr}`;
}
