import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode, SetStateAction } from "react";
import axios from "axios";
import { useUser } from "../hooks/UserHook";
import useLocalStorage from "../hooks/utils/useLocalStorage";
import i18n from "../../i18n/i18n";

const SettingsContext = createContext<SettingsContextType | null>(null);

export interface SettingsContextType {
    orderHabits: string[  ] | null;
    setOrderHabits: React.Dispatch<React.SetStateAction<string[  ] | null>>;
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    accent: string;
    setAccent: React.Dispatch<React.SetStateAction<string>>;    
    grad: string;
    setGrad: React.Dispatch<React.SetStateAction<string>>;
    bg: string;
    setBg: React.Dispatch<React.SetStateAction<string>>;
    decor: string;
    setDecor: React.Dispatch<React.SetStateAction<string>>;    
    lang:string,
    setLang: React.Dispatch<React.SetStateAction<string>>;    
    emote: string;
    setEmote: React.Dispatch<React.SetStateAction<string>>;    
    messdb: string;
    setMessdb: React.Dispatch<React.SetStateAction<string>>;
    twoAuth: boolean | null;
    setTwoAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
    note: boolean;
    setNote: React.Dispatch<React.SetStateAction<boolean>>;    
    habitsNote: boolean;
    setHabitsNote: React.Dispatch<React.SetStateAction<boolean>>;
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
    isDark:boolean
}

interface SettingsResponse {
    success: boolean;
    order: string[  ];
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
    accent: "settings_accent",
    grad: "settings_grad",
    bg: "settings_bg",
    decor: "settings_decor",
    emote:"settings_emote",
    messdb:"settings_messdb",
    note:"settings_note",
    messnote:"settings_messnote",
    habitsnote:"settings_habitsnote",
    lang:"settings_lang"
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const API_URL = import.meta.env.VITE_API_URL;

    const [ theme, setTheme ] = useLocalStorage(LOCAL_KEYS.theme, "system");
    const [ accent, setAccent ] = useLocalStorage(LOCAL_KEYS.accent, "poison");
    const [ grad, setGrad ] = useLocalStorage(LOCAL_KEYS.grad, "meadow");
    const [ bg, setBg ] = useLocalStorage(LOCAL_KEYS.bg, "default");
    const [ decor, setDecor ] = useLocalStorage(LOCAL_KEYS.decor, "default");
    const [ lang, setLang ] = useLocalStorage(LOCAL_KEYS.lang, "ru");
    const [ emote, setEmote ] = useLocalStorage(LOCAL_KEYS.emote, "Heart")
    const [ messdb, setMessdb ] = useLocalStorage(LOCAL_KEYS.messdb, "reaction")
    const [ note, setNote ] = useLocalStorage(LOCAL_KEYS.note, true);
    const [ messNote, setMessNote ] = useLocalStorage(LOCAL_KEYS.messnote, true);
    const [ habitsNote, setHabitsNote ] = useLocalStorage(LOCAL_KEYS.habitsnote, true);

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark =
        theme === "dark" ||
        (theme === "system" && systemDark);

    const [ orderHabits, setOrderHabits ] = useState<string[  ] | null>(null);
    const [ bgUrl, setBgUrl ] = useState<string>("");
    const [ twoAuth, setTwoAuth ] = useState<boolean | null>(null);
    const [ privateShow, setPrivate ] = useState<PrivateSettings>({ number: "", mail: "", habits: "", posts: "" });
    const [ showArchived, setShowArchived ] = useState<boolean>(false);
    const [ showArchivedInAcc, setShowArchivedInAcc ] = useState<boolean>(false);
    const [ weekStart, setWeekStart ] = useState<string | null>(null);
    const [ tab, setTab ] = useState<string>('menu');

    useEffect(() => {
        i18n.changeLanguage(lang);
    }, [lang]);

    const refetchSettings = useCallback(async () => {
        try {
            const res = await axios.get<SettingsResponse>(`${API_URL}settings`, {
                withCredentials: true,
            });

            if (res.data.success) {
                setOrderHabits(res.data.order ?? [ "everyday", "weekly", "sometimes" ]);
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
    }, [ API_URL ]);

    useEffect(() => {
        if (user) refetchSettings();
    }, [ refetchSettings, user ]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        document.documentElement.setAttribute("data-accent", accent);
        document.documentElement.setAttribute("data-grad", grad);
        document.documentElement.setAttribute("data-decor", decor);
    }, [isDark, accent, grad, decor]);

    return (
        <SettingsContext.Provider value={{
            orderHabits, setOrderHabits, tab, setTab, refetchSettings,
            theme, setTheme,
            accent, setAccent,
            grad, setGrad,
            bg, setBg,
            decor, setDecor,
            bgUrl, lang, setLang,
            privateShow, setPrivate,
            twoAuth, setTwoAuth,
            note, setNote,
            messNote, setMessNote,
            showArchived, setShowArchived,
            showArchivedInAcc, setShowArchivedInAcc,
            weekStart, setWeekStart,
            setEmote, emote, setMessdb, messdb,
            habitsNote, setHabitsNote, isDark
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;