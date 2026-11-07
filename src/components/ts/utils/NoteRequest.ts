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

// Local browser fallback. An active Push subscription receives notifications
// from the shared Service Worker, so don't create a second desktop notification.
export async function showBrowserNotification(title: string, options?: NotificationOptions & { url?: string }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  let registration: ServiceWorkerRegistration | undefined;
  if ("serviceWorker" in navigator) {
    try {
      registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) return;
    } catch {
      // Browser notifications can still work without Push.
    }
  }

  const { url, ...notificationOptions } = options ?? {};
  try {
    const notification = new Notification(title, notificationOptions);

    notification.onclick = () => {
      window.focus();
      if (url) window.location.href = url;
      notification.close();
    };
  } catch {
    // Safari does not support the Notification() constructor in all contexts.
    if (registration) {
      await registration.showNotification(title, { ...notificationOptions, data: { url: url || "/" } });
    }
  }
}
