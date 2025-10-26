import { createContext, useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { type ReactNode } from "react"
import { api } from "../ts/api";
import { useNote } from "../hooks/NoteHook";
import type { PrivateSettings } from "./SettingsContext";
import type { Media } from "./ChatContext";
import type { User } from "./UserContext";
import type { Habit } from "./HabitsContext";

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
    refetchAcc:(contactId:string) => Promise<void>
    refetchPosts:(contactId:string) => Promise<void>
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

    const refetchAcc = useCallback(async (contactId: string) => {
        if (!contactId) return;
        setAccLoading(true);
        try {
            const res = await api.get(`${API_URL}acc/${contactId}`);
            if (res.data.success) {
                setAcc(res.data.acc);
                setHabits(res.data.habits);
                setPrivateRules(res.data.privateRules);
                setMedia(res.data.media);
            }
        } catch {
            showNotification("error", "Не удалось найти пользователя");
        } finally {
            setAccLoading(false);
        }
    }, [API_URL, showNotification]);

    const refetchPosts = useCallback(async (contactId: string) => {
        if (!contactId) return;
        setPostsLoading(true);
        try {
            const res = await api.get(`${API_URL}posts/${contactId}`);
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