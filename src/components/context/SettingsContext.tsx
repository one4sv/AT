import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode, SetStateAction } from "react";
import axios from "axios";
import { useUser } from "../hooks/UserHook";

const SettingsContext = createContext<SettingsContextType | null>(null);

export interface SettingsContextType {
    orderHabits: string[] | null
    setOrderHabits: React.Dispatch<React.SetStateAction<string[] | null>>    
    theme: string
    setTheme: React.Dispatch<React.SetStateAction<string>>
    acsent: string
    setAcsent: React.Dispatch<React.SetStateAction<string>>    
    bg: string
    setBg: React.Dispatch<React.SetStateAction<string>>
    decor: string
    setDecor: React.Dispatch<React.SetStateAction<string>>
    twoAuth: boolean | null
    setTwoAuth: React.Dispatch<React.SetStateAction<boolean | null>>    
    note: boolean
    setNote: React.Dispatch<React.SetStateAction<boolean>>    
    messNote: boolean
    setMessNote: React.Dispatch<React.SetStateAction<boolean>>
    bgUrl: string;
    privateShow: PrivateSettings
    setPrivate: React.Dispatch<React.SetStateAction<PrivateSettings>>
    tab: string
    setTab: React.Dispatch<React.SetStateAction<string>>
    showArchived: boolean,
    setShowArchived: React.Dispatch<SetStateAction<boolean>>
    showArchivedInAcc: boolean,
    setShowArchivedInAcc: React.Dispatch<SetStateAction<boolean>>
    refetchSettings: () => Promise<void>;
}

interface SettingsResponse {
    success: boolean;
    order: string[];
    private: PrivateSettings;
    theme: string;
    acsent: string;
    bg: string;
    decor: string;
    bg_url: string;
    twoAuth: boolean;
    all_note: boolean;
    new_mess_note: boolean;
    show_archived: boolean;
    show_archived_in_acc: boolean;
}

export interface PrivateSettings {
    number: string,
    mail: string,
    habits: string,
    posts: string
}

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const API_URL = import.meta.env.VITE_API_URL;

    const [orderHabits, setOrderHabits] = useState<string[] | null>(null);
    const [theme, setTheme] = useState<string>("");
    const [acsent, setAcsent] = useState<string>("");
    const [bg, setBg] = useState<string>("");
    const [bgUrl, setBgUrl] = useState<string>("");
    const [decor, setDecor] = useState<string>("");
    const [twoAuth, setTwoAuth] = useState<boolean | null>(null);
    const [note, setNote] = useState<boolean>(true);
    const [messNote, setMessNote] = useState<boolean>(true);
    const [privateShow, setPrivate] = useState<PrivateSettings>({ number: "", mail: "", habits: "", posts: "" });
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [showArchivedInAcc, setShowArchivedInAcc] = useState<boolean>(false);
    const [tab, setTab] = useState<string>('acc');

    const refetchSettings = useCallback(async () => {
        try {
            const res = await axios.get<SettingsResponse>(`${API_URL}settings`, {
                withCredentials: true,
            });
            if (res.data.success) {
                setOrderHabits(res.data.order ?? ["everyday", "weekly", "sometimes"]);
                setTheme(res.data.theme ?? "system");
                setPrivate(res.data.private ?? { number: "contacts", mail: "contacts", habits: "all", posts: "all" });
                setAcsent(res.data.acsent ?? "poison");
                setBg(res.data.bg ?? "default");
                setDecor(res.data.decor ?? "default");
                setBgUrl(res.data.bg_url ?? "");
                setTwoAuth(res.data.twoAuth ?? false);
                setNote(res.data.all_note ?? true);
                setMessNote(res.data.new_mess_note ?? true);
                setShowArchived(res.data.show_archived ?? false);
                setShowArchivedInAcc(res.data.show_archived_in_acc ?? false);
            }
        } catch (err) {
            console.error("Ошибка загрузки настроек:", err);
        }
    }, []);

    useEffect(() => {
        if (user) refetchSettings();
    }, [refetchSettings, user]);

    return (
        <SettingsContext.Provider value={{
            orderHabits, setOrderHabits, tab, setTab, refetchSettings,
            theme, setTheme, privateShow, setPrivate, setAcsent, acsent, bg, setBg, bgUrl,
            decor, setDecor, twoAuth, setTwoAuth, note, setNote, messNote, setMessNote,
            showArchived, setShowArchived, showArchivedInAcc, setShowArchivedInAcc
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export default SettingsContext;