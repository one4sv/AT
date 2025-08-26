import { useEffect, useState, createContext, useCallback, type ReactNode } from "react";
import axios from "axios";
import { useSettings } from "../hooks/SettingsHook";
import { useUser } from "../hooks/UserHook";
import { useNote } from "../hooks/NoteHook";
import type { PersFeedHabits } from "./SettingsContext";
import type { PrivateSettings } from "./SettingsContext";

export type UpdateSettingsContextType = {
    setNewOrder: (val: string[]) => void;
    setNewAmount: (val: number[]) => void;
    setNewPersFeedHabits: (val:PersFeedHabits[])=> void;
    setNewPrivateShow: (val: PrivateSettings) => void;
    isUpdating: string[];
};

type UpdateQueueItem = {
    setting: string;
    value: string | string[] | number[] | PersFeedHabits[] | PrivateSettings;
};

const UpdateSettingsContext = createContext<UpdateSettingsContextType | null>(null);

export const UpdateSettingsProvider = ({ children }: { children: ReactNode }) => {
    const { refetchSettings, amountHabits, orderHabits, persFeedHabits } = useSettings();
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

    const setNewPersFeedHabits = useCallback((val: PersFeedHabits[]) => {
        setUpdateQueue((prev) => [...prev.filter((item) => item.setting !== "persFeedHabits"), {setting:"persFeedHabits", value:val}]);
        setIsUpdating((prev) => [...new Set([...prev, "pers"])])
    },[])

    const processQueue = useCallback(async () => {
        if (isProcessing || updateQueue.length === 0) return;
        setIsProcessing(true);

        const { setting, value } = updateQueue[0];

        // Проверка, изменились ли данные
        if (
            (setting === "amountHabits" && JSON.stringify(value) === JSON.stringify(amountHabits)) ||
            (setting === "order" && JSON.stringify(value) === JSON.stringify(orderHabits)) ||
            (setting === "username" && value === user.username) ||
            (setting === "nick" && value === user.nick) ||
            (setting === "mail" && value === user.mail) ||
            (setting === "persFeedHabits" && JSON.stringify(value) === JSON.stringify(persFeedHabits))
        ) {
            setUpdateQueue((prev) => prev.slice(1));
            setIsUpdating((prev) => prev.filter((item) => item !== (setting === "order" || setting === "amountHabits" ? "habits" : "acc")));
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
            setIsUpdating((prev) => prev.filter((item) => item !== (setting === "order" || setting === "amountHabits" ? "habits" : "acc")));
            setIsProcessing(false);
        }
    }, [isProcessing, updateQueue, amountHabits, orderHabits, user.username, user.nick, user.mail, persFeedHabits, refetchSettings, refetchUser, showNotification]);

    useEffect(() => {
        const handler = setTimeout(() => {
            processQueue();
        }, 500); // Увеличил задержку для обработки очереди
        return () => clearTimeout(handler);
    }, [updateQueue, processQueue]);

    return (
        <UpdateSettingsContext.Provider
            value={{ setNewOrder, setNewAmount, isUpdating, setNewPersFeedHabits, setNewPrivateShow }}
        >
            {children}
        </UpdateSettingsContext.Provider>
    );
};

export default UpdateSettingsContext;