export default function formatLastOnline(lastOnline: string | null | undefined) {
  if (!lastOnline) return "";

  // Всегда парсим как UTC (если приходит без Z — добавим)
  const utcString = lastOnline.endsWith("Z") ? lastOnline : `${lastOnline}Z`;
  const lastDateUTC = new Date(utcString);

  // Переводим в локальное время
  const localLastDate = new Date(
    lastDateUTC.getTime() + new Date().getTimezoneOffset() * -60000
  );

  const now = new Date();

  const diffMs = now.getTime() - localLastDate.getTime();
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
  if (localLastDate > yesterday) return "В сети вчера";

  // Для более старых дат — "09 окт."
  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `В сети ${localLastDate.toLocaleDateString("ru-RU", options)}`;
}
