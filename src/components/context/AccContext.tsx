import type { JSONContent } from "@tiptap/core";
import type { PostMedia } from "../../pages/Post/RichPost";
import { createContext, useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { type ReactNode } from "react"
import { api } from "../ts/api";
import { useNote } from "../hooks/NoteHook";
import type { PrivateSettings } from "./SettingsContext";
import type { Media } from "./ChatContext";
import type { User } from "./UserContext";
import type { Habit } from "./HabitsContext";
import type { OneOffPlan } from "./PlansContext";
import axios from "axios";

const AccContext = createContext<AccContextType | null>(null);

export type PostType = {
    id:number,
    user:User,
    media?:PostMedia[];
    content?: JSONContent | null;
    visibility?: "inherit" | "all" | "contacts" | "nobody" | "link";
    habit?:Habit,
    text:string,
    likes:(string | null)[],
    created_at: string,
    comments_count:number
}
export interface AccContextType {
    refetchAcc:(nick:string, silent?: boolean) => Promise<void>
    refetchPosts:(nick:string, silent?: boolean) => Promise<void>
    acc:User | undefined,
    habits:Habit[] | undefined,
    plans:OneOffPlan[],
    loading:boolean,
    posts:PostType[] | undefined,
    setPosts:Dispatch<SetStateAction<PostType[]>>
    media:Media[] | undefined,
    privateRules: PrivateSettings,
    isMyAcc:boolean,
    setIsMyAcc:React.Dispatch<SetStateAction<boolean>>

}
export const AccProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();

    const [ acc, setAcc ] = useState<User>();
    const [ habits, setHabits ] = useState<Habit[]>();
    const [ plans, setPlans ] = useState<OneOffPlan[]>([]);
    const [ posts, setPosts ] = useState<PostType[]>([]);
    const [ media, setMedia ] = useState<Media[]>([]);
    const [ privateRules, setPrivateRules ] = useState<PrivateSettings>({
        number: "",
        mail: "",
        profile: "",
        habits: "",
        posts: "",
        plans: "",
    });
    const [ accLoading, setAccLoading ] = useState<boolean>(true);
    const [ postsLoading, setPostsLoading ] = useState<boolean>(true);
    const [ isMyAcc, setIsMyAcc ] = useState<boolean>(false);

    const API_URL = import.meta.env.VITE_API_URL;

    const refetchAcc = useCallback(async (nick: string, silent = false) => {
        if (!nick) return;
        if (!silent) setAccLoading(true);
        try {
            const res = await api.get(`acc/${nick}`, { params: { share: new URLSearchParams(window.location.search).get("share") || undefined } });
            if (res.data.success) {
                setAcc(res.data.acc);
                setHabits(res.data.habits);
                setPlans(Array.isArray(res.data.plans) ? res.data.plans : []);
                setPrivateRules(res.data.privateRules);
                setMedia(res.data.media);
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) return;
            }
            console.log(err)
        } finally {
            setAccLoading(false);
        }
    }, [API_URL, showNotification]);

    const refetchPosts = useCallback(async (nick: string, silent = false) => {
        if (!nick) return;
        if (!silent) setPostsLoading(true);
        try {
            const res = await api.get(`posts/${nick}`, { params: { share: new URLSearchParams(window.location.search).get("share") || undefined } });
            if (res.data.success) {
                setPosts(res.data.posts);
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) return;
            }
            console.log(err)
        } finally {
            setPostsLoading(false);
        }
    }, [API_URL]);

    const loading = accLoading || postsLoading;

    useEffect(() => {
        setIsMyAcc(false)
    }, [])

    return (
        <AccContext.Provider
            value={{
                refetchAcc,
                acc,
                habits,
                plans,
                loading,
                posts,
                media,
                privateRules,
                setPosts,
                refetchPosts,
                isMyAcc,
                setIsMyAcc
            }}
        >
            {children}
        </AccContext.Provider>
    );
};


export default AccContext;