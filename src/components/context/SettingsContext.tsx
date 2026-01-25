import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useUser } from "../hooks/UserHook";
const SettingsContext = createContext<SettingsContextType | null>(null);

export interface SettingsContextType {
    orderHabits:string[] | null
    setOrderHabits: React.Dispatch<React.SetStateAction<string[] | null>>    
    theme:string
    setTheme:React.Dispatch<React.SetStateAction<string>>
    acsent:string
    setAcsent:React.Dispatch<React.SetStateAction<string>>    
    bg:string
    setBg:React.Dispatch<React.SetStateAction<string>>
    decor:string
    setDecor:React.Dispatch<React.SetStateAction<string>>
    twoAuth:boolean | null
    setTwoAuth:React.Dispatch<React.SetStateAction<boolean | null>>    
    note:boolean
    setNote:React.Dispatch<React.SetStateAction<boolean>>    
    messNote:boolean
    setMessNote:React.Dispatch<React.SetStateAction<boolean>>
    bgUrl:string;
    privateShow:PrivateSettings
    setPrivate:React.Dispatch<React.SetStateAction<PrivateSettings>>
    tab: string
    setTab: React.Dispatch<React.SetStateAction<string>>
    refetchSettings: () => Promise<void>;
}

interface SettingsResponse {
    success: boolean;
    order: string[];
    private:PrivateSettings;
    theme:string;
    acsent:string;
    bg:string;
    decor:string;
    bg_url:string;
    twoAuth:boolean;
    all_note:boolean;
    new_mess_note:boolean;
}
export interface PrivateSettings {
    number: string,
    mail:string,
    habits:string,
    posts:string
}

export const SettingsProvider = ({children}:{children:ReactNode}) => {
    const { user } = useUser()
    const API_URL = import.meta.env.VITE_API_URL

    const [ orderHabits, setOrderHabits ] = useState<string[] | null>([])
    const [ theme, setTheme ] = useState<string>("")
    const [ acsent, setAcsent ] = useState<string>("")
    const [ bg, setBg ] = useState<string>("")
    const [ bgUrl, setBgUrl ] = useState<string>("")
    const [ decor, setDecor ] = useState<string>("")
    const [ twoAuth, setTwoAuth ] = useState<boolean | null>(false)
    const [ note, setNote ] = useState<boolean>(true)
    const [ messNote, setMessNote ] = useState<boolean>(true)
    const [ privateShow, setPrivate ] = useState<PrivateSettings>({number: "", mail:"", habits:"", posts:""})
    const [ tab, setTab ] = useState<string>('acc')

    const refetchSettings = useCallback( async() => {
        try {
            const res = await axios.get<SettingsResponse>(`${API_URL}settings`, {
                withCredentials: true,
            })
            if (res.data.success) {
                setOrderHabits(res.data.order)
                setTheme(res.data.theme)
                setPrivate(res.data.private)
                setAcsent(res.data.acsent)
                setBg(res.data.bg)
                setDecor(res.data.decor)
                setBgUrl(res.data.bg_url)
                setTwoAuth(res.data.twoAuth)
                setNote(res.data.all_note)
                setMessNote(res.data.new_mess_note)
            }
        }
        catch (err) {
            console.log("Ошибка", err)
        }
    }, [])
    
    useEffect(() => {
        if (user) refetchSettings();
    }, [refetchSettings, user]);

    return(
        <SettingsContext.Provider value={{ orderHabits, setOrderHabits, tab, setTab, refetchSettings,
         theme, setTheme, privateShow, setPrivate, setAcsent, acsent, bg, setBg, bgUrl,
          decor, setDecor, twoAuth, setTwoAuth, note, setNote, messNote, setMessNote }}>
            {children}
        </SettingsContext.Provider>
    )
}

export default SettingsContext;