import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { type ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
import { useNavigate, useLocation } from "react-router";

export interface User {
    id: string | null;
    nick: string | null;
    mail: string | null;
    username: string | null;
    bio:string | null;
    avatar_url: string | null;
    last_online: string | null;
}

interface UserResponse {
    success: boolean;
    id?: string;
    nick?: string;
    mail?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
    last_online: string;
    error?: string;
    cookie?: boolean;
}

export interface UserContextType {
    user: User;
    loadingUser: boolean;
    initialLoading: boolean;
    isAuthenticated: boolean;
    refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useNote();

    const [user, setUser] = useState<User>({ nick: null, mail: null, username: null, id:null, bio:null, avatar_url:null, last_online:null });
    const [loadingUser, setLoadingUser] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const wsRef = useRef<WebSocket | null>(null);
    
    const isAuthenticated = !!user.nick;

    const refetchUser = useCallback(async () => {
        if (initialLoading) setLoadingUser(true);

        try {
            const res = await axios.get<UserResponse>("http://localhost:3001/user", {
                withCredentials: true,
            });
            if (res.data.success) {
                setUser({
                    nick: res.data.nick ?? null,
                    mail: res.data.mail ?? null,
                    username: res.data.username ?? null,
                    bio: res.data.bio ?? null,
                    id: res.data.id ?? null,
                    avatar_url: res.data.avatar_url ?? null,
                    last_online:res.data.last_online ?? null,
                });
            } else {
                setUser({ nick: null, mail: null, username: null, id:null, bio:null, avatar_url:null, last_online:null });
                if (!res.data.cookie) {
                    showNotification("error", res.data.error || "Ошибка авторизации");
                }
            }
        } catch (err) {
            setUser({ nick: null, mail: null, username: null, id: null, bio:null, avatar_url:null, last_online:null });
            if (axios.isAxiosError(err)) {
                if (err.response?.status !== 401 && err.response?.status !== 403) {
                    showNotification("error", err.response?.data?.error || "Ошибка авторизации");
                }
            }
        } finally {
            setLoadingUser(false);
            setInitialLoading(false);
        }
    }, [initialLoading, showNotification]);

    useEffect(() => {
        if (initialLoading)
        refetchUser();
    }, [initialLoading, refetchUser, user.nick]);

    useEffect(() => {
        if (initialLoading || loadingUser) return;

        if (!isAuthenticated && location.pathname !== "/confirm" && location.pathname !== "/admin" && !initialLoading) {
            navigate("/sign");
        }
    }, [isAuthenticated, loadingUser, navigate, location.pathname, initialLoading]);

    useEffect(() => {
        if (!user?.id) return;

        wsRef.current = new WebSocket(`ws://localhost:3001/ws?userId=${user.id}`);

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "USER_STATUS") {
                console.log(
                    `Пользователь ${data.userId} ${data.isOnline ? "в сети" : "вышел"}`
                );
            }
        };

        return () => {
            wsRef.current?.close();
        };
    }, [user?.id]);

    return (
        <UserContext.Provider value={{ isAuthenticated, user, loadingUser, initialLoading, refetchUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;