// NotificationAggregator.ts
import type { Media } from "../../context/ChatContext";
import { showBrowserNotification } from "./NoteRequest";

type NotificationPayload = {
  content: string;
  files?: Media[];
  is_group: boolean;
  chat_id: string;
  nick?: string | null;
  username?: string | null;
  chat_name?: string | null;
};

type NotificationData = {
  count: number;
  lastMessage: NotificationPayload;
  senders: Set<string>;
  timerId?: number | null;
};

export class NotificationAggregator {
  private notificationsQueue = new Map<string, NotificationData>();
  private AGG_WINDOW = 1000; // ms, можно сделать параметром

  // Добавить новое сообщение в очередь
  public enqueueMessage(chatKey: string, messageData: NotificationPayload) {
    let q = this.notificationsQueue.get(chatKey);
    if (!q) {
      q = {
        count: 0,
        lastMessage: messageData,
        senders: new Set(),
        timerId: null,
      };
      this.notificationsQueue.set(chatKey, q);
    }
    q.count += 1;
    q.lastMessage = messageData;
    q.senders.add(messageData.username ?? messageData.nick ?? "Аноним");

    if (!q.timerId) {
      q.timerId = window.setTimeout(() => {
        this.flushNotificationForChat(chatKey);
      }, this.AGG_WINDOW);
    }
  }

  // Показать уведомление и очистить очередь для chatKey
  private flushNotificationForChat(chatKey: string) {
    const q = this.notificationsQueue.get(chatKey);
    if (!q) return;

    const { count, lastMessage, senders } = q;

    const senderName = lastMessage.is_group
      ? lastMessage.username ?? lastMessage.nick ?? "Группа"
      : lastMessage.username ?? lastMessage.nick ?? "Новый собеседник";

    const title = lastMessage.is_group
      ? `${lastMessage.chat_name ?? "Группа"} — ${senders.size > 1 ? `${senders.size} отправителей` : senderName}`
      : senderName;

    const body = count > 1
      ? `${count} новых сообщений`
      : lastMessage.content && lastMessage.content.trim() !== ""
        ? lastMessage.content
        : (lastMessage.files?.length ?? 0) > 0
          ? `${lastMessage.files?.length} медиафайл(ов)`
          : "Пересланное сообщение";

    showBrowserNotification(title, {
      body,
      icon: "/favicon.png",
      url: lastMessage.is_group ? `/chat/g/${lastMessage.chat_id}` : `/chat/${lastMessage.nick}`,
    });

    if (q.timerId) {
      clearTimeout(q.timerId);
    }
    this.notificationsQueue.delete(chatKey);
  }
}
