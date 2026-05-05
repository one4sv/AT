import { createContext, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
const NoteContext = createContext<NoteContextType | null>(null);

export interface NoteContextType {
    type: string;
    txt: string;
    display: boolean;
    id: number;
    showNotification: (newtype: noteType, newtxt: string) => void;
    setDisplay: (display: boolean) => void;
}
export type noteType = 'error' | 'success' | 'info' | 'false'

export const NoteProvider = ({children}:{children:ReactNode}) => {
    const [type,setType] = useState<noteType>('false');
    const [txt, setTxt] = useState('');
    const [display, setDisplay] = useState(false);
    const [id, setId] = useState(0);

    const timeoutRef = useRef<number | null>(null);
    const hideRef = useRef<number | null>(null);

    const showNotification = useCallback(({newtype, newtxt} : {newtype:noteType, newtxt:string}) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (hideRef.current) clearTimeout(hideRef.current)

        setType(newtype);
        setTxt(newtxt);
        setDisplay(true);
        setId(prev=>prev+1);

        timeoutRef.current = setTimeout(() => {
            setDisplay(false)

            hideRef.current = setTimeout(() => {
                setType('false');
                setTxt('');
            },600);
        },3000);
    },[])
    return(
        <NoteContext.Provider value={{type, txt, display, id, showNotification: (newtype, newtxt) => showNotification({ newtype, newtxt }), setDisplay}}>
            {children}
        </NoteContext.Provider>
    )
}

export default NoteContext;