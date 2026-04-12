import { useContext } from "react";
import WebSocketContext from "../context/WebSocketContext";
import type { WebSocketContextType } from "../context/WebSocketContext";

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within an WebSocketProvider");
    }
    return context;
};
