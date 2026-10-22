import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useUser } from "../hooks/UserHook";
export interface WebSocketContextType {
    ws: WebSocket | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (data: any) => void;
    isConnected: boolean;
}
const WebSocketContext = createContext<WebSocketContextType | null>(null);
export const WebSocketProvider = ({
    children
}: {
    children: ReactNode;
}) => {
    const { user } = useUser();
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const API_WS = import.meta.env.VITE_API_WS;

    useEffect(
        () => {
            if (!user?.id || wsRef.current) return;
            const ws = new WebSocket(`${API_WS}ws?userId=${user.id}`);
            wsRef.current = ws;
            ws.onopen = () => {
                console.log("🟢 WebSocket подключён");
                if (wsRef.current === ws) setIsConnected(true);
            };
            ws.onclose = () => {
                console.log("🔴 WebSocket отключён");
                if (wsRef.current === ws) {
                    setIsConnected(false);
                    wsRef.current = null;
                }
            };
            ws.onerror = err => console.error("WebSocket ошибка:", err);
            return () => {
                ws.onopen = null;
                ws.onclose = null;
                ws.close();
                wsRef.current = null;
                setIsConnected(false);
            };
        },
        [user?.id, API_WS]
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const send = (data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket не подключён, сообщение не отправлено");
        }
    };

    return (
        <WebSocketContext.Provider
            value={{
                ws: wsRef.current,
                send,
                isConnected
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};
export default WebSocketContext;
