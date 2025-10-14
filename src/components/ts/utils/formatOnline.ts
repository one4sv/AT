export default function formatLastOnline(lastOnline: string | null | undefined) {
  if (!lastOnline) return "";

  const lastDate = new Date(lastOnline); // просто парсим напрямую
  if (isNaN(lastDate.getTime())) return ""; // на случай некорректной строки

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
  if (lastDate > yesterday) return "В сети вчера";

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `В сети ${lastDate.toLocaleDateString("ru-RU", options)}`;
}
