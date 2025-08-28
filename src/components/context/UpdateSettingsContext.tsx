import { useEffect, useState, createContext, useCallback, type ReactNode } from "react";
import axios from "axios";
import { useSettings } from "../hooks/SettingsHook";
import { useUser } from "../hooks/UserHook";
import { useNote } from "../hooks/NoteHook";
import type { PrivateSettings } from "./SettingsContext";

export type UpdateSettingsContextType = {
    setNewOrder: (val: string[]) => void;
    setNewAmount: (val: number[]) => void;
    setNewTheme: (val:string)=> void;
    setNewAcsent: (val:string)=> void;
    setNewPrivateShow: (val: PrivateSettings) => void;
    isUpdating: string[];
};

type UpdateQueueItem = {
    setting: string;
    value: string | string[] | number[] | PrivateSettings;
};

const UpdateSettingsContext = createContext<UpdateSettingsContextType | null>(null);

export const UpdateSettingsProvider = ({ children }: { children: ReactNode }) => {
    const { refetchSettings, amountHabits, orderHabits, theme, acsent } = useSettings();
    const { refetchUser, user } = useUser();
    const { showNotification } = useNote();
    const [ updateQueue, setUpdateQueue ] = useState<UpdateQueueItem[]>([]);
    const [ isUpdating, setIsUpdating ] = useState<string[]>([]);
    const [ isProcessing, setIsProcessing ] = useState(false);

    const setNewOrder = useCallback((val: string[]) => {
        setUpdateQueue((prev) => [...prev.filter((item) => item.setting !== "order"), { setting: "order", value: val }]);
        setIsUpdating((prev) => [...new Set([...prev, "habits"])]);
    }, []);    

    const setNewPrivateShow = useCallback((val: PrivateSettings) => {
        setUpdateQueue((prev) => [
            ...prev.filter((item) => item.setting !== "private"),
            { setting: "private", value: val }
        ]);
        setIsUpdating((prev) => [...new Set([...prev, "private"])]);
    }, []);


    const setNewAmount = useCallback((val: number[]) => {
        setUpdateQueue((prev) => [
            ...prev.filter((item) => item.setting !== "amountHabits"),
            { setting: "amountHabits", value: val },
        ]);
        setIsUpdating((prev) => [...new Set([...prev, "habits"])]);
    }, []);

    const setNewTheme = useCallback((val: string) => {
        setUpdateQueue((prev) => [...prev.filter((item) => item.setting !== "theme"), {setting:"theme", value:val}]);
        setIsUpdating((prev) => [...new Set([...prev, "pers"])])
    },[])
    const setNewAcsent = useCallback((val: string) => {
        setUpdateQueue((prev) => [...prev.filter((item) => item.setting !== "acsent"), {setting:"acsent", value:val}]);
        setIsUpdating((prev) => [...new Set([...prev, "pers"])])
    },[])

    const processQueue = useCallback(async () => {
        if (isProcessing || updateQueue.length === 0) return;
        setIsProcessing(true);

        const { setting, value } = updateQueue[0];

        // определяем, какой маркер isUpdating соответствует текущей настройке
        const updatingKey = (s: string) =>
            s === "order" || s === "amountHabits" ? "habits"
            : s === "theme" || s === "acsent" ? "pers"
            : s === "private" ? "private"
            : "acc";
 
        // Проверка, изменились ли данные
        if (
            (setting === "amountHabits" && JSON.stringify(value) === JSON.stringify(amountHabits)) ||
            (setting === "order" && JSON.stringify(value) === JSON.stringify(orderHabits)) ||
            (setting === "username" && value === user.username) ||
            (setting === "nick" && value === user.nick) ||
            (setting === "mail" && value === user.mail) ||
            (setting === "theme" && value === theme) ||
            (setting === "acsent" && value === acsent)
        ) {
            setUpdateQueue((prev) => prev.slice(1));
            setIsUpdating((prev) => prev.filter((item) => item !== updatingKey(setting)));
            setIsProcessing(false);
            return;
        }

        const payload = { [setting]: value };
        console.log("Отправляю на сервер", setting, value);

        try {
            const res = await axios.post("http://localhost:3001/updatesettings", payload, {
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
    }, [isProcessing, updateQueue, amountHabits, orderHabits, user.username, user.nick, user.mail, theme, refetchSettings, refetchUser, showNotification, acsent]);

    useEffect(() => {
        const handler = setTimeout(() => {
            processQueue();
        }, 500); // Увеличил задержку для обработки очереди
        return () => clearTimeout(handler);
    }, [updateQueue, processQueue]);

    return (
        <UpdateSettingsContext.Provider
            value={{ setNewOrder, setNewAmount, isUpdating, setNewTheme, setNewPrivateShow, setNewAcsent }}
        >
            {children}
        </UpdateSettingsContext.Provider>
    );
};

export default UpdateSettingsContext;