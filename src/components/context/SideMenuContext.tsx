import { createContext, useState, useEffect, type ReactNode, type SetStateAction } from "react";
import { useLocation } from "react-router-dom";

export type tab = "chats" | "habits" | "spots" | "user"

interface SideMenuContextType {
    showSideMenu: boolean;
    setShowSideMenu:React.Dispatch<SetStateAction<boolean>>,
    red:boolean,
    setRed:React.Dispatch<SetStateAction<boolean>>,
    showHabitMenu:boolean,
    setShowHabitMenu:React.Dispatch<SetStateAction<boolean>>,
    showSettings: boolean,
    setShowSettings:React.Dispatch<SetStateAction<boolean>>,
    showJurnal:boolean,
    setShowJurnal:React.Dispatch<SetStateAction<boolean>>,    
    showChatMenu:boolean,
    setShowChatMenu:React.Dispatch<SetStateAction<boolean>>,
    returnSlide:() => void,
    activeTab: tab,
    setActiveTab: React.Dispatch<SetStateAction<tab>>,
    messageSelectedValue: string,
    setMessageSelectedValue: React.Dispatch<SetStateAction<string>>,
    habitsSelectedValue: string,
    setHabitsSelectedValue: React.Dispatch<SetStateAction<string>>
    translateX: number,
    setTranslateX: React.Dispatch<SetStateAction<number>>
    isDragging: boolean,
    setIsDragging: React.Dispatch<SetStateAction<boolean>>
    dontHandle: boolean,
    setDontHandle: React.Dispatch<SetStateAction<boolean>>
    dontHandleOther: boolean,
    setDontHandleOther: React.Dispatch<SetStateAction<boolean>>
}
const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export function SideMenuProvider({ children }: { children: ReactNode }) {
    const [ showSideMenu, setShowSideMenu  ] = useState(true);
    const [ red, setRed ] = useState<boolean>(false);
    const [ showHabitMenu, setShowHabitMenu ] = useState(false)
    const [ showSettings, setShowSettings ] = useState(false)
    const [ showJurnal, setShowJurnal ] = useState(false)
    const [ showChatMenu, setShowChatMenu ] = useState(false)
    const [ activeTab, setActiveTab ] = useState<tab>("chats")
    const [ translateX, setTranslateX ] = useState(0);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ dontHandle, setDontHandle ] = useState(false)
    const [ dontHandleOther, setDontHandleOther ] = useState(false)
    const [ messageSelectedValue, setMessageSelectedValue ] = useState("")
    const [ habitsSelectedValue, setHabitsSelectedValue ] = useState("")

    const location = useLocation();

    useEffect(() => {
        setShowSideMenu(false);
        setTranslateX(-100)
    }, [location.pathname]);

    useEffect(() => {
        setRed(false)
    }, [location.pathname])

    const returnSlide = () => {
        if (showJurnal) setShowJurnal(false)
        else if (showSettings) setShowSettings(false)
        else if (showChatMenu) setShowChatMenu(false)
        else setShowHabitMenu(false)
    }

    return (
        <SideMenuContext.Provider value={{ showSideMenu, setShowSideMenu, red, setRed, showHabitMenu, setShowHabitMenu, showSettings, setShowSettings, showChatMenu, setShowChatMenu,
        showJurnal, setShowJurnal, returnSlide, activeTab, setActiveTab, setTranslateX, translateX, setIsDragging, isDragging, dontHandle, setDontHandle, setDontHandleOther, dontHandleOther,
        messageSelectedValue, setMessageSelectedValue, habitsSelectedValue, setHabitsSelectedValue }}>
            {children}
        </SideMenuContext.Provider>
    );
}
export default SideMenuContext
