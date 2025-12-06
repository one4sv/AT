import { useContext } from "react";
import MessagesContext from "../context/MessagesContext.tsx";
import type { MessagesContextType } from "../context/MessagesContext.tsx";

export const useMessages = (): MessagesContextType => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error("useMessages must be used within an MessagesProvider");
    }
    return context;
};
