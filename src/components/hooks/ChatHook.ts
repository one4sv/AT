import { useContext } from "react";
import ChatContext from "../context/ChatContext";
import type { ChatContextType } from "../context/ChatContext";

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within an ChatProvider");
    }
    return context;
};
