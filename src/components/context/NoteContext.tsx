import { createContext, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
const NoteContext = createContext<NoteContextType | null>(null);

export type SettingNotice = { title: string; detail: string; undo: () => void; icon?: ReactNode };

export interface NoteContextType {
    settingNotice: SettingNotice | null;
    showSettingNotice: (notice: SettingNotice) => void;
    clearSettingNotice: () => void;
    type: noteType;
    txt: string;
    display: boolean;
    id: number;
    showNotification: (newtype: noteType, newtxt: string) => void;
    setDisplay: (display: boolean) => void;
    showDevNote: () => void
}
export type noteType = 'error' | 'success' | 'info' | 'note' | 'false'

export const NoteProvider = ({children}:{children:ReactNode}) => {
    const [type, setType] = useState<noteType>('false');
    const [txt, setTxt] = useState('');
    const [display, setDisplay] = useState(false);
    const [id, setId] = useState(0);

    const [settingNotice, setSettingNotice] = useState<SettingNotice | null>(null);
    const settingTimer = useRef<number | null>(null);
    const clearSettingNotice = useCallback(() => {
        if (settingTimer.current !== null) window.clearTimeout(settingTimer.current);
        settingTimer.current = null;
        setSettingNotice(null);
    }, []);
    const showSettingNotice = useCallback((notice: SettingNotice) => {
        if (settingTimer.current !== null) window.clearTimeout(settingTimer.current);
        setSettingNotice(notice);
        settingTimer.current = window.setTimeout(clearSettingNotice, 8000);
    }, [clearSettingNotice]);
    const timeoutRef = useRef<number | null>(null);
    const hideRef = useRef<number | null>(null);

    const showNotification = useCallback(({newtype, newtxt} : {newtype:noteType, newtxt:string}) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (hideRef.current) clearTimeout(hideRef.current)

        setType(newtype);
        setTxt(newtxt);
        setDisplay(true);
        setId(prev=>prev+1);

        timeoutRef.current = window.setTimeout(() => {
            setDisplay(false)

            hideRef.current = window.setTimeout(() => {
                setType('false');
                setTxt('');
            },600);
        },3000);
    },[])

    const showDevNote =() => {
        showNotification({newtype:"info", newtxt:"В разработке"})
    }
    return(
        <NoteContext.Provider value={{type, txt, display, id, settingNotice, showSettingNotice, clearSettingNotice, showNotification: (newtype, newtxt) => showNotification({ newtype, newtxt }), setDisplay, showDevNote}}>
            {children}
        </NoteContext.Provider>
    )
}

export default NoteContext;