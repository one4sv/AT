// utils/notifications.ts
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Браузер не поддерживает уведомления");
    return false;
  }

  if (Notification.permission === "granted") return true;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function showBrowserNotification(title: string, options?: NotificationOptions & { url?: string }) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();

      if (options?.url) {
        window.location.href = options.url;
      }

      notification.close();
    };
  }
}

