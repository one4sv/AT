import { createContext, useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { type ReactNode } from "react"
import { api } from "../ts/api";
import { useNote } from "../hooks/NoteHook";
import type { PrivateSettings } from "./SettingsContext";
import type { Media } from "./ChatContext";
import type { User } from "./UserContext";
import type { Habit } from "./HabitsContext";
import { useNavigate } from "react-router";

const AccContext = createContext<AccContextType | null>(null);

export type PostType = {
    id:number,
    user:User,
    media?:Media[];
    habit?:Habit,
    text:string,
    likes:(string | null)[],
    created_at: string,
    comments_count:number
}
export interface AccContextType {
    refetchAcc:(nick:string) => Promise<void>
    refetchPosts:(nick:string) => Promise<void>
    acc:User | undefined,
    habits:Habit[] | undefined,
    loading:boolean,
    posts:PostType[] | undefined,
    setPosts:Dispatch<SetStateAction<PostType[]>>
    media:Media[] | undefined,
    privateRules: PrivateSettings,

}
export const AccProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();

    const navigate = useNavigate()

    const [acc, setAcc] = useState<User>();
    const [habits, setHabits] = useState<Habit[]>();
    const [posts, setPosts] = useState<PostType[]>([]);
    const [media, setMedia] = useState<Media[]>([]);
    const [privateRules, setPrivateRules] = useState<PrivateSettings>({
        number: "",
        mail: "",
        habits: "",
        posts: "",
    });
    const [accLoading, setAccLoading] = useState<boolean>(true);
    const [postsLoading, setPostsLoading] = useState<boolean>(true);

    const API_URL = import.meta.env.VITE_API_URL;

    const refetchAcc = useCallback(async (nick: string) => {
        if (!nick) return;
        setAccLoading(true);
        try {
            const res = await api.get(`${API_URL}acc/${nick}`);
            if (res.data.success) {
                setAcc(res.data.acc);
                setHabits(res.data.habits);
                setPrivateRules(res.data.privateRules);
                setMedia(res.data.media);
            } else {
                showNotification("error", "Не удалось найти пользователя");
                if (window.history.length > 1) {
                    navigate(-1);
                } else {
                    navigate("/"); // заменить на нужный маршрут списка чатов
                }
            }
        } catch {
            showNotification("error", "Не удалось найти пользователя");
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate("/"); // заменить на нужный маршрут списка чатов
            }
        } finally {
            setAccLoading(false);
        }
    }, [API_URL, showNotification]);

    const refetchPosts = useCallback(async (nick: string) => {
        if (!nick) return;
        setPostsLoading(true);
        try {
            const res = await api.get(`${API_URL}posts/${nick}`);
            if (res.data.success) {
                setPosts(res.data.posts);
            }
        } catch {
            showNotification("error", "Не удалось найти посты");
        } finally {
            setPostsLoading(false);
        }
    }, [API_URL, showNotification]);

    // общий loading: true, если хотя бы один из подзагрузчиков активен
    const loading = accLoading || postsLoading;

    return (
        <AccContext.Provider
            value={{
                refetchAcc,
                acc,
                habits,
                loading,
                posts,
                media,
                privateRules,
                setPosts,
                refetchPosts,
            }}
        >
            {children}
        </AccContext.Provider>
    );
};


export default AccContext;