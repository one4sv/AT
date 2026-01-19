import { createContext, type ReactNode } from "react";
import { api } from "../ts/api";
import type { message } from "./ChatContext";
import { useChat } from "../hooks/ChatHook";
import { useNote } from "../hooks/NoteHook";

const SendMessContext = createContext<SendMessContextType | null>(null);

export interface SendMessContextType {
    sendMess: (receiver:{ nick?: string, id?: string }, text: string, files?: File[], answer_id?: string, redirect?:message[], showNames?:boolean) => Promise<boolean |  undefined>,
    editMess:(messageId: number, text: string, newFiles: File[], keptUrls: string[], answer_id?: string)=>Promise<boolean | undefined>

} 

export const SendMessProvider = ({ children }: { children: ReactNode }) => {
    const { refetchContactsWTLoading } = useChat()
    const { showNotification } = useNote()
    const API_URL = import.meta.env.VITE_API_URL;

    const sendMess = async (receiver:{ nick?: string, id?: string }, text: string, files: File[] = [], answer_id?:string, redirect?:message[], showNames?:boolean) => {
        if (!text.trim() && files.length === 0 && !redirect) return;
        try {
            const formData = new FormData();
            formData.append("text", text);
            if (redirect) {
                const ids = [...new Set(redirect.map(m => m.id))]
                formData.append("redirect", JSON.stringify(ids))
                formData.append("showNames", showNames ? "1" : "0")
            }
            if (answer_id) formData.append("answer_id", answer_id)
            if (receiver.id) formData.append("chat_id", receiver.id);
            else if (receiver.nick) formData.append("receiver_nick", receiver.nick)
            files.forEach(file => formData.append("files", file));

            const res = await api.post(`${API_URL}chat`, formData)
            if (res.data.success) {
                refetchContactsWTLoading();
                return true;
            }
        } catch (error) {
            console.error("Ошибка при отправке:", error);
            showNotification("error", "Не удалось отправить сообщение");
            return false;
        }
    };

    const editMess = async (messageId: number, text: string, newFiles: File[] = [], keptUrls: string[] = [], answer_id?: string) => {
        try {
            const formData = new FormData();
            formData.append("text", text);
            if (answer_id) formData.append("answer_id", answer_id);
            formData.append("kept_urls", JSON.stringify(keptUrls));
            newFiles.forEach(file => formData.append("files", file));
            const res = await api.patch(`${API_URL}messages/${messageId}`, formData)
            if (res.data.success) {
                refetchContactsWTLoading();
                return true;
            }
        } catch (error) {
            console.error("Ошибка при редактировании:", error);
            showNotification("error", "Не удалось отредактировать сообщение");
            return false;
        }
    };

  return (
    <SendMessContext.Provider value={{ sendMess, editMess }}>
      {children}
    </SendMessContext.Provider>
  );
};

export default SendMessContext
