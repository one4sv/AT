import { createContext, type ReactNode } from "react";
import { api } from "../ts/api";
import axios from "axios";
import { materializeDroppedFiles } from "../ts/utils/fileDrop";
import { useTranslation } from "react-i18next";
import type { message } from "./ChatContext";
import { useNote } from "../hooks/NoteHook";
import { useContacts } from "../hooks/ContactsHook";

export type LinkedEntity = { type: "user" | "habit" | "plan" | "post" | "group"; id: string };
const SendMessContext = createContext<SendMessContextType | null>(null);

export interface SendMessContextType {
    sendMess: (receiver:{ nick?: string, id?: string }, text: string, files?: File[], answer_id?: string, redirect?:message[], showNames?:boolean, onConfirmed?: (messages: message[]) => void, linkedEntity?: LinkedEntity) => Promise<boolean | undefined>,
    editMess:(messageId: number, text: string, newFiles: File[], keptUrls: string[], answer_id?: string)=>Promise<boolean | undefined>
    pinMess: (messageId:string) => Promise<boolean | undefined>
} 

export const SendMessProvider = ({ children }: { children: ReactNode }) => {
    const { refetchContactsWTLoading } = useContacts()
    const { showNotification } = useNote()
    const { t } = useTranslation("common");

    const sendMess = async (receiver:{ nick?: string, id?: string }, text: string, files: File[] = [], answer_id?:string, redirect?:message[], showNames?:boolean, onConfirmed?: (messages: message[]) => void, linkedEntity?: LinkedEntity) => {
        if (!text.trim() && files.length === 0 && !redirect && !linkedEntity) return;
        try {
            const formData = new FormData();
            formData.append("text", text);
            if (linkedEntity) {
                formData.append("entity_type", linkedEntity.type);
                formData.append("entity_id", linkedEntity.id);
            }
            if (redirect) {
                const ids = [...new Set(redirect.map(m => m.id))]
                formData.append("redirect", JSON.stringify(ids))
                formData.append("showNames", showNames ? "1" : "0")
            }
            if (answer_id) formData.append("answer_id", answer_id)
            if (receiver.id) formData.append("chat_id", receiver.id);
            else if (receiver.nick) formData.append("receiver_nick", receiver.nick)
            const preparedFiles = await materializeDroppedFiles(files);
            preparedFiles.forEach(file => formData.append("files", file));

            const res = await api.post(`chat`, formData)
            if (res.data.success && Array.isArray(res.data.messages) && res.data.messages.length > 0) {
                onConfirmed?.(res.data.messages);
                refetchContactsWTLoading();
                return true;
            }
            throw new Error("Сервер не вернул отправленное сообщение");
        } catch (error) {
            console.error("Ошибка при отправке:", error);
            showNotification("error", (axios.isAxiosError(error) && error.response?.status === 413 || error instanceof Error && error.message === "CHAT_FILE_LIMIT") ? t("chatUi.fileLimit") : error instanceof Error && (error.name === "NotReadableError" || error.message === "FILE_UNREADABLE") ? t("chatUi.dropReadFailed") : "Не удалось отправить сообщение");
            return false;
        }
    };

    const editMess = async (messageId: number, text: string, newFiles: File[] = [], keptUrls: string[] = [], answer_id?: string) => {
        try {
            const formData = new FormData();
            formData.append("text", text);
            if (answer_id) formData.append("answer_id", answer_id);
            formData.append("kept_urls", JSON.stringify(keptUrls));
            const preparedFiles = await materializeDroppedFiles(newFiles);
            preparedFiles.forEach(file => formData.append("files", file));
            const res = await api.patch(`messages/${messageId}`, formData)
            if (res.data.success) {
                refetchContactsWTLoading();
                return true;
            }
        } catch (error) {
            console.error("Ошибка при редактировании:", error);
            showNotification("error", (axios.isAxiosError(error) && error.response?.status === 413 || error instanceof Error && error.message === "CHAT_FILE_LIMIT") ? t("chatUi.fileLimit") : error instanceof Error && (error.name === "NotReadableError" || error.message === "FILE_UNREADABLE") ? t("chatUi.dropReadFailed") : "Не удалось отредактировать сообщение");
            return false;
        }
    };
    
    const pinMess = async (messageId: string) => {
        try {
            const res = await api.post(`pinmess`, { message_id: messageId });
            if (res.data.success) {
                refetchContactsWTLoading();
                return true;
            }
        } catch (error) {
            console.error("Ошибка при закреплении:", error);
            showNotification("error", "Не удалось закрепить сообщение");
            return false;
        }
    };

  return (
    <SendMessContext.Provider value={{ sendMess, editMess, pinMess }}>
      {children}
    </SendMessContext.Provider>
  );
};

export default SendMessContext
