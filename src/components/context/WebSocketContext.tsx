import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
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

    useEffect(() => {
        if (!user?.id || !API_WS) return;
        let disposed = false;
        let reconnect: number | undefined;


        const connect = async () => {
            if (disposed) return;
            try {
                const { data } = await api.post("/auth/ws-ticket");
                if (disposed) return;
                if (!data?.ticket) throw new Error("WebSocket ticket unavailable");

                const endpoint = new URL(`${API_WS}ws`);
                endpoint.searchParams.set("ticket", data.ticket);
                const ws = new WebSocket(endpoint.toString());
                wsRef.current = ws;

                ws.onopen = () => {
                    if (disposed) return;
                    setIsConnected(true);
                };
                ws.onclose = () => {
                    if (wsRef.current === ws) {
                        wsRef.current = null;
                        setIsConnected(false);
                    }
                    if (!disposed) reconnect = window.setTimeout(() => void connect(), 5000);
                };
                ws.onerror = error => console.error("WebSocket connection error:", error);
            } catch (error) {
                if (!disposed) {
                    console.error("WebSocket authorization error:", error);
                    reconnect = window.setTimeout(() => void connect(), 5000);
                }
            }
        };

        void connect();
        return () => {
            disposed = true;
            if (reconnect !== undefined) window.clearTimeout(reconnect);
            wsRef.current?.close();
            wsRef.current = null;
            setIsConnected(false);
        };
    }, [user?.id, API_WS]);
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
