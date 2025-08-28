import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
const SettingsContext = createContext<SettingsContextType | null>(null);

export interface SettingsContextType {
    orderHabits:string[] | null
    setOrderHabits: React.Dispatch<React.SetStateAction<string[] | null>>    
    amountHabits:number[] | null
    setAmountHabits: React.Dispatch<React.SetStateAction<number[] | null>>
    theme:string
    setTheme:React.Dispatch<React.SetStateAction<string>>
    acsent:string
    setAcsent:React.Dispatch<React.SetStateAction<string>>
    privateShow:PrivateSettings
    setPrivate:React.Dispatch<React.SetStateAction<PrivateSettings>>
    tab: string
    setTab: React.Dispatch<React.SetStateAction<string>>
    refetchSettings: () => Promise<void>;
}

interface SettingsResponse {
    success: boolean;
    order: string[];
    amountHabits:number[];
    private:PrivateSettings;
    theme:string;
    acsent:string;
}
export interface PrivateSettings {
    number: string,
    mail:string,
    habits:string,
    posts:string
}

export const SettingsProvider = ({children}:{children:ReactNode}) => {
    const [ orderHabits, setOrderHabits ] = useState<string[] | null>([])
    const [ amountHabits, setAmountHabits ] = useState<number[] | null>([])
    const [ theme, setTheme ] = useState<string>("")
    const [ acsent, setAcsent ] = useState<string>("")
    const [ privateShow, setPrivate ] = useState<PrivateSettings>({number: "", mail:"", habits:"", posts:""})
    const [ tab, setTab ] = useState<string>('acc')

    const refetchSettings = useCallback( async() => {
        try {
            const res = await axios.get<SettingsResponse>("http://localhost:3001/settings", {
                withCredentials: true,
            })
            if (res.data.success) {
                setOrderHabits(res.data.order)
                setAmountHabits(res.data.amountHabits)
                setTheme(res.data.theme)
                setPrivate(res.data.private)
                setAcsent(res.data.acsent)
            }
        }
        catch (err) {
            console.log("Ошибка", err)
        }
    }, [])

    useEffect(() => {
            refetchSettings();
    }, [refetchSettings]);

    return(
        <SettingsContext.Provider value={{ orderHabits, setOrderHabits, tab, setTab, refetchSettings, amountHabits, setAmountHabits, theme, setTheme, privateShow, setPrivate, setAcsent, acsent }}>
            {children}
        </SettingsContext.Provider>
    )
}

export default SettingsContext;