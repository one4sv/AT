import { useEffect, useState, createContext, useCallback, type ReactNode } from "react";
import axios from "axios";
import { useSettings } from "../hooks/SettingsHook";
import { useUser } from "../hooks/UserHook";
import { useNote } from "../hooks/NoteHook";
import type { PrivateSettings } from "./SettingsContext";

export type UpdateSettingsContextType = {
    setNewOrder: (val: string[]) => void;
    setNewTheme: (val:string)=> void;
    setNewAccent: (val:string)=> void;
    setNewGrad: (val:string)=> void;
    setNewBg: (val:string)=> void;
    setNewLang:(val:string) => void;
    setNewMessdb: (val:string)=> void;
    setNewEmote: (val:string)=> void;
    setNewDecor: (val:string)=> void;
    setBgUrl:(val:File) => void;
    setNewNote:(val:boolean) => void;
    setNewMessNote:(val:boolean) => void;
    setNewHabitsNote:(val:boolean) => void;
    setNewPrivateShow: (val: PrivateSettings) => void;
    setNewShowArchived: (val: boolean) => void;
    setNewShowArchivedInAcc: (val: boolean) => void;
    setNewWeekStart: (val: string) => void;
    isUpdating: string[];
};

type UpdateQueueItem = {
    setting: string;
    value: string | string[] | number[] | PrivateSettings | boolean;
};

const UpdateSettingsContext = createContext<UpdateSettingsContextType | null>(null);

export const UpdateSettingsProvider = ({ children }: { children: ReactNode }) => {
    const { refetchSettings, orderHabits, showArchived, showArchivedInAcc, setTheme, setAccent, setBg, setDecor, setMessdb, setEmote, setNote, setMessNote, setHabitsNote, setGrad, setLang } = useSettings();
    const { refetchUser, user } = useUser();
    const { showNotification } = useNote();
    const API_URL = import.meta.env.VITE_API_URL

    const [ updateQueue, setUpdateQueue ] = useState<UpdateQueueItem[]>([]);
    const [ isUpdating, setIsUpdating ] = useState<string[]>([]);
    const [ isProcessing, setIsProcessing ] = useState(false);

    const setNewOrder = useCallback((val: string[]) => {
        setUpdateQueue((prev) => [...prev.filter((item) => item.setting !== "order"), { setting: "order", value: val }]);
        setIsUpdating((prev) => [...new Set([...prev, "habits"])]);
    }, []);    
    const setNewShowArchived = useCallback((val: boolean) => {
        setUpdateQueue((prev) => [...prev.filter((item) => item.setting !== "show_archived"), {setting:"show_archived", value:val}]);
        setIsUpdating((prev) => [...new Set([...prev, "habits"])])
    },[])    
    const setNewShowArchivedInAcc = useCallback((val: boolean) => {
        setUpdateQueue((prev) => [...prev.filter((item) => item.setting !== "show_archived_in_acc"), {setting:"show_archived_in_acc", value:val}]);
        setIsUpdating((prev) => [...new Set([...prev, "habits"])])
    },[])
    const setNewWeekStart = useCallback((val: string) => {
        setUpdateQueue((prev) => [
            ...prev.filter((item) => item.setting !== "week_start"),
            { setting: "week_start", value: val }
        ]);
        setIsUpdating((prev) => [...new Set([...prev, "habits"])]);
    }, []);

    const setNewPrivateShow = useCallback((val: PrivateSettings) => {
        setUpdateQueue((prev) => [
            ...prev.filter((item) => item.setting !== "private"),
            { setting: "private", value: val }
        ]);
        setIsUpdating((prev) => [...new Set([...prev, "private"])]);
    }, []);

    const setNewTheme = useCallback((val: string) => {
        setTheme(val);
    }, [setTheme]);

    const setNewAccent = useCallback((val: string) => {
        setAccent(val);
    }, [setAccent]);    

    const setNewGrad = useCallback((val: string) => {
        setGrad(val);
    }, [setGrad]);

    const setNewBg = useCallback((val: string) => {
        setBg(val);
    }, [setBg]);

    const setNewDecor = useCallback((val: string) => {
        setDecor(val);
    }, [setDecor]);    

    const setNewEmote = useCallback((val: string) => {
        setEmote(val);
    }, [setEmote]);    

    const setNewMessdb = useCallback((val: string) => {
        setMessdb(val);
    }, [setMessdb]);    

    const setNewNote = useCallback((val: boolean) => {
        setNote(val);
    }, [setNote]);    

    const setNewMessNote = useCallback((val: boolean) => {
        setMessNote(val);
    }, [setMessNote]);    

    const setNewHabitsNote = useCallback((val: boolean) => {
        setHabitsNote(val);
    }, [setHabitsNote]);    
    const setNewLang = useCallback((val: string) => {
        setLang(val);
    }, [setLang]);


    const setBgUrl = async(val: File) => {
        try {
            const bg = new FormData();
            bg.append("bg", val);
            const upRes = await axios.post(`${API_URL}uploadbg`, bg, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (upRes.data?.success) {
                await refetchSettings();
            } else {
                showNotification("error", upRes.data?.error || "Не удалось загрузить аватар");
                return;
            }
        } catch {
            showNotification("error", "Не удалось загрузить аватар");
            return;
        }
    }

    const processQueue = useCallback(async () => {
        if (isProcessing || updateQueue.length === 0) return;
        setIsProcessing(true);

        const { setting, value } = updateQueue[0];

        // определяем, какой маркер isUpdating соответствует текущей настройке
        const updatingKey = (s: string) => {
            if (s === "order" || s === "show_archived" || s === "show_archived_in_acc") return "habits";
            if (s === "private") return "private";
            return "acc";
        };
 
        // Проверка, изменились ли данные
        if (
            (setting === "order" && JSON.stringify(value) === JSON.stringify(orderHabits)) ||
            (setting === "show_archived" && value === showArchived) ||
            (setting === "show_Archived_in_acc" && value === showArchivedInAcc) ||
            (setting === "username" && value === user.username) ||
            (setting === "nick" && value === user.nick) ||
            (setting === "mail" && value === user.mail)
        ) {
            setUpdateQueue((prev) => prev.slice(1));
            setIsUpdating((prev) => prev.filter((item) => item !== updatingKey(setting)));
            setIsProcessing(false);
            return;
        }

        const payload = { [setting]: value };
        console.log("Отправляю на сервер", setting, value);

        try {
            const res = await axios.post(`${API_URL}updatesettings`, payload, {
                withCredentials: true,
            });
            if (res.data.success) {
                console.log("✅ Успешно обновлено:", setting);
                refetchSettings();
                if (["username", "nick", "mail"].includes(setting)) {
                    await refetchUser();
                }
            } else {
                showNotification("error", res.data.error || "Ошибка при обновлении настроек");
            }
        } catch (err) {
            let errorMessage = "Ошибка при обновлении настроек";
            if (axios.isAxiosError(err) && err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            showNotification("error", errorMessage);
            console.error("❌ Ошибка при обновлении настроек:", err);
        } finally {
            setUpdateQueue((prev) => prev.slice(1));
            setIsUpdating((prev) => prev.filter((item) => item !== updatingKey(setting)));
            setIsProcessing(false);
        }
    }, [isProcessing, updateQueue, orderHabits, showArchived, showArchivedInAcc, user.username, user.nick, user.mail, API_URL, refetchSettings, refetchUser, showNotification]);

    useEffect(() => {
        const handler = setTimeout(() => {
            processQueue();
        }, 500); // Увеличил задержку для обработки очереди
        return () => clearTimeout(handler);
    }, [updateQueue, processQueue]);

    return (
        <UpdateSettingsContext.Provider
            value={{ setNewOrder, isUpdating, setNewTheme, setNewPrivateShow, setNewAccent, setNewBg, setBgUrl, setNewDecor, setNewMessNote, setNewNote, 
                setNewShowArchived, setNewShowArchivedInAcc, setNewWeekStart, setNewEmote, setNewMessdb, setNewHabitsNote, setNewGrad, setNewLang }}
        >
            {children}
        </UpdateSettingsContext.Provider>
    );
};

export default UpdateSettingsContext;