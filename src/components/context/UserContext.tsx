import { createContext, useState, useEffect, useCallback } from "react";
import { type ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
import { useNavigate, useLocation } from "react-router";

export interface User {
    id: number | null;
    nick: string | null;
    mail: string | null;
    username: string | null;
    bio:string | null;
    avatar_url: string | null;
}

interface UserResponse {
    success: boolean;
    id?: number;
    nick?: string;
    mail?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
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

    const [user, setUser] = useState<User>({ nick: null, mail: null, username: null, id:null, bio:null, avatar_url:null });
    const [loadingUser, setLoadingUser] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

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
                    avatar_url: res.data.avatar_url ?? null
                });
            } else {
                setUser({ nick: null, mail: null, username: null, id:null, bio:null, avatar_url:null });
                if (!res.data.cookie) {
                    showNotification("error", res.data.error || "Ошибка авторизации");
                }
            }
        } catch (err) {
            setUser({ nick: null, mail: null, username: null, id: null, bio:null, avatar_url:null });
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
        refetchUser();
    }, [refetchUser]);

    useEffect(() => {
        // ждём, пока данные пользователя загрузятся
        if (initialLoading || loadingUser) return;

        // если пользователь не авторизован — уводим
        if (!isAuthenticated && location.pathname !== "/confirm" && location.pathname !== "/admin") {
            navigate("/log");
        }
    }, [isAuthenticated, loadingUser, navigate, location.pathname, initialLoading]);

    return (
        <UserContext.Provider value={{ isAuthenticated, user, loadingUser, initialLoading, refetchUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;