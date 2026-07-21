import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode, SetStateAction } from "react";
import axios from "axios";
import { useUser } from "../hooks/UserHook";

const SettingsContext = createContext<SettingsContextType | null>(null);

export interface SettingsContextType {
    orderHabits: string[] | null;
    setOrderHabits: React.Dispatch<React.SetStateAction<string[] | null>>;
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    acsent: string;
    setAcsent: React.Dispatch<React.SetStateAction<string>>;
    bg: string;
    setBg: React.Dispatch<React.SetStateAction<string>>;
    decor: string;
    setDecor: React.Dispatch<React.SetStateAction<string>>;
    twoAuth: boolean | null;
    setTwoAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
    note: boolean;
    setNote: React.Dispatch<React.SetStateAction<boolean>>;
    messNote: boolean;
    setMessNote: React.Dispatch<React.SetStateAction<boolean>>;
    bgUrl: string;
    privateShow: PrivateSettings;
    setPrivate: React.Dispatch<React.SetStateAction<PrivateSettings>>;
    tab: string;
    setTab: React.Dispatch<React.SetStateAction<string>>;
    showArchived: boolean;
    setShowArchived: React.Dispatch<SetStateAction<boolean>>;
    showArchivedInAcc: boolean;
    setShowArchivedInAcc: React.Dispatch<SetStateAction<boolean>>;
    weekStart: string | null;
    setWeekStart: React.Dispatch<React.SetStateAction<string | null>>;
    refetchSettings: () => Promise<void>;
}

interface SettingsResponse {
    success: boolean;
    order: string[];
    private: PrivateSettings;
    twoAuth: boolean;
    all_note: boolean;
    new_mess_note: boolean;
    show_archived: boolean;
    show_archived_in_acc: boolean;
    week_start: string;
    bg_url: string;
}

export interface PrivateSettings {
    number: string;
    mail: string;
    habits: string;
    posts: string;
}

const LOCAL_KEYS = {
    theme: "settings_theme",
    acsent: "settings_acsent",
    bg: "settings_bg",
    decor: "settings_decor",
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const API_URL = import.meta.env.VITE_API_URL;

    const [theme, setTheme] = useState<string>(() => localStorage.getItem(LOCAL_KEYS.theme) || "system");
    const [acsent, setAcsent] = useState<string>(() => localStorage.getItem(LOCAL_KEYS.acsent) || "poison");
    const [bg, setBg] = useState<string>(() => localStorage.getItem(LOCAL_KEYS.bg) || "default");
    const [decor, setDecor] = useState<string>(() => localStorage.getItem(LOCAL_KEYS.decor) || "default");

    const [orderHabits, setOrderHabits] = useState<string[] | null>(null);
    const [bgUrl, setBgUrl] = useState<string>("");
    const [twoAuth, setTwoAuth] = useState<boolean | null>(null);
    const [note, setNote] = useState<boolean>(true);
    const [messNote, setMessNote] = useState<boolean>(true);
    const [privateShow, setPrivate] = useState<PrivateSettings>({ number: "", mail: "", habits: "", posts: "" });
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [showArchivedInAcc, setShowArchivedInAcc] = useState<boolean>(false);
    const [weekStart, setWeekStart] = useState<string | null>(null);
    const [tab, setTab] = useState<string>('menu');

    useEffect(() => { localStorage.setItem(LOCAL_KEYS.theme, theme); }, [theme]);
    useEffect(() => { localStorage.setItem(LOCAL_KEYS.acsent, acsent); }, [acsent]);
    useEffect(() => { localStorage.setItem(LOCAL_KEYS.bg, bg); }, [bg]);
    useEffect(() => { localStorage.setItem(LOCAL_KEYS.decor, decor); }, [decor]);

    const refetchSettings = useCallback(async () => {
        try {
            const res = await axios.get<SettingsResponse>(`${API_URL}settings`, {
                withCredentials: true,
            });

            if (res.data.success) {
                setOrderHabits(res.data.order ?? ["everyday", "weekly", "sometimes"]);
                setPrivate(res.data.private ?? { number: "contacts", mail: "contacts", habits: "all", posts: "all" });
                setTwoAuth(res.data.twoAuth ?? false);
                setNote(res.data.all_note ?? true);
                setMessNote(res.data.new_mess_note ?? true);
                setShowArchived(res.data.show_archived ?? false);
                setShowArchivedInAcc(res.data.show_archived_in_acc ?? false);
                setWeekStart(res.data.week_start ?? null);
                setBgUrl(res.data.bg_url ?? "");
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) return;
            console.error("Ошибка загрузки настроек:", err);
        }
    }, [API_URL]);

    useEffect(() => {
        if (user) refetchSettings();
    }, [refetchSettings, user]);

    return (
        <SettingsContext.Provider value={{
            orderHabits, setOrderHabits, tab, setTab, refetchSettings,
            theme, setTheme,
            acsent, setAcsent,
            bg, setBg,
            decor, setDecor,
            bgUrl,
            privateShow, setPrivate,
            twoAuth, setTwoAuth,
            note, setNote,
            messNote, setMessNote,
            showArchived, setShowArchived,
            showArchivedInAcc, setShowArchivedInAcc,
            weekStart, setWeekStart,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;