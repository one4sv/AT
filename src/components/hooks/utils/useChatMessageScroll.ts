import { useContext } from "react";
import ChatMessageScrollContext from "../../context/ChatMessageScrollContext";

export function useChatMessageScroll() {
    const context = useContext(ChatMessageScrollContext);
    if (!context) {
        throw new Error("useChatMessageScroll must be used within ChatMessageScrollProvider");
    }

    return context;
}