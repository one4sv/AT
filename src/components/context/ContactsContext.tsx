import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { type ReactNode } from "react";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import { useWebSocket } from "../hooks/WebSocketHook";
import axios from "axios";

export interface message {
    id: number;
    sender_id: string;
    sender_name: string;
    sender_nick: string;
    content: string;
    created_at: Date;
    files?: Media[];
    read_by: string[];
    reactions: ReactionsType[];
    answer_id: number | null;
    edited: boolean;
    redirected_id: number | null;
    redirected_name?: string | null;
    redirected_nick?: string | null;
    redirected_content?: string | null;
    redirected_files?: Media[] | null;
    redirected_answer?: number | null;
    is_system: boolean;
    is_pinned: boolean;
    target_id: string | null;
}

export interface Media {
    url: string;
    name: string;
    type: string;
    message_id: string;
}

export interface ReactionsType {
    user_id: string;
    reaction: string;
}

export interface Contact {
    id: string;
    name: string | null;
    nick: string;
    avatar_url?: string | null;
    lastMessage: message | null;
    unread_count: number;
    note: boolean;
    is_blocked: boolean;
    pinned: boolean;
    is_group: boolean;
}

/** Возможные значения фильтра */
export type ContactsFilter = "personal" | "group" | undefined;

export interface ContactsContextType {
    list: Contact[];
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    filter: ContactsFilter;
    setFilter: React.Dispatch<React.SetStateAction<ContactsFilter>>;
    refetchContacts: () => Promise<void>;
    refetchContactsWTLoading: () => Promise<void>;
    onlineMap: Record<string, boolean>;
    loadingList: boolean;
    mainSearchRef: React.RefObject<HTMLInputElement | null>;
    findContacts: (
        search: string,
        controller: AbortController,
        filter?: ContactsFilter
    ) => Promise<Contact[] | undefined>;
}

const ContactsContext = createContext<ContactsContextType | null>(null);

export const ContactsProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useUser();
    const { ws } = useWebSocket();
    const API_URL = import.meta.env.VITE_API_URL;

    const [list, setList] = useState<Contact[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState<string>("");
    const [filter, setFilter] = useState<ContactsFilter>(undefined);
    const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

    const mainSearchRef = useRef<HTMLInputElement | null>(null);
    const contactsAbortRef = useRef<AbortController | null>(null);

    const findContacts = async (
        search: string,
        controller: AbortController,
        filter?: ContactsFilter
    ): Promise<Contact[] | undefined> => {
        try {
            const res = await api.post(
                `${API_URL}contacts`,
                { search, filter },
                { signal: controller.signal }
            );
            if (controller.signal.aborted) return;

            if (res.data.success) {
                const sortedList: Contact[] = res.data.friendsArr
                    .slice()
                    .sort((a: Contact, b: Contact) => {
                        if (a.pinned !== b.pinned) {
                            return a.pinned ? -1 : 1;
                        }
                        const timeA = a.lastMessage
                            ? new Date(a.lastMessage.created_at).getTime()
                            : 0;
                        const timeB = b.lastMessage
                            ? new Date(b.lastMessage.created_at).getTime()
                            : 0;
                        return timeB - timeA;
                    });
                return sortedList;
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) return;
                console.log("error", err.response?.data?.error);
            }
        }
    };

    const refetchContactsWTLoading = useCallback(async () => {
        if (!isAuthenticated) return;

        contactsAbortRef.current?.abort();
        const controller = new AbortController();
        contactsAbortRef.current = controller;

        try {
            const result = await findContacts(search, controller, filter);
            if (result) {
                setList(result);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) return;
                console.log("error", err.response?.data?.error);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoadingList(false);
            }
        }
    }, [API_URL, search, filter, isAuthenticated]);

    const refetchContacts = useCallback(async () => {
        setLoadingList(true);
        await refetchContactsWTLoading();
    }, [refetchContactsWTLoading]);

    // WebSocket — обновления списка и статусов
    useEffect(() => {
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (
                data.type === "NEW_MESSAGE" ||
                data.type === "MESSAGE_READ" ||
                data.type === "MESSAGE_DELETED" ||
                data.type === "MESSAGE_EDITED" ||
                data.type === "GROUP_UPDATED" ||
                data.type === "KICKED_FROM_GROUP"
            ) {
                refetchContactsWTLoading();
            }

            if (data.type === "USER_STATUS") {
                setOnlineMap((prev) => ({
                    ...prev,
                    [data.userId]: data.isOnline,
                }));
            }
        };

        ws.addEventListener("message", handleMessage);
        return () => ws.removeEventListener("message", handleMessage);
    }, [ws, refetchContactsWTLoading]);

    useEffect(() => {
        const timer = setTimeout(refetchContacts, 100);
        return () => clearTimeout(timer);
    }, [search, filter, refetchContacts]);

    return (
        <ContactsContext.Provider
            value={{
                list,
                search,
                setSearch,
                filter,
                setFilter,
                refetchContacts,
                refetchContactsWTLoading,
                onlineMap,
                loadingList,
                mainSearchRef,
                findContacts,
            }}
        >
            {children}
        </ContactsContext.Provider>
    );
};

export default ContactsContext;