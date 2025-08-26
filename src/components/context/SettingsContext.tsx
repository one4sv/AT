import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
const SettingsContext = createContext<SettingsContextType | null>(null);

export interface SettingsContextType {
    orderHabits:string[] | null
    setOrderHabits: React.Dispatch<React.SetStateAction<string[] | null>>    
    amountHabits:number[] | null
    setAmountHabits: React.Dispatch<React.SetStateAction<number[] | null>>
    persFeedHabits:PersFeedHabits[] | null
    setPersFeedHabits: React.Dispatch<React.SetStateAction<PersFeedHabits[] | null>>
    privateShow:PrivateSettings
    setPrivate:React.Dispatch<React.SetStateAction<PrivateSettings>>
    tab: string
    setTab: React.Dispatch<React.SetStateAction<string>>
    refetchSettings: () => Promise<void>;
}

export interface PersFeedHabits {
    type:string,
    theme:string,
    colors:string[] | []
}
interface SettingsResponse {
    success: boolean;
    order: string[];
    amountHabits:number[];
    persFeedHabits:PersFeedHabits[];
    private:PrivateSettings;
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
    const [ persFeedHabits, setPersFeedHabits ] = useState<PersFeedHabits[] | null>(null)
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
                setPersFeedHabits(res.data.persFeedHabits)
                setPrivate(res.data.private)
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
        <SettingsContext.Provider value={{ orderHabits, setOrderHabits, tab, setTab, refetchSettings, amountHabits, setAmountHabits, persFeedHabits, setPersFeedHabits, privateShow, setPrivate }}>
            {children}
        </SettingsContext.Provider>
    )
}

export default SettingsContext;