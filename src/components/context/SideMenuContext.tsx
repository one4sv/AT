import { createContext, useState, useEffect, type ReactNode, type SetStateAction } from "react";
import { useLocation } from "react-router-dom";

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
    returnSlide:() => void,
    setNoEsc: React.Dispatch<SetStateAction<boolean>>,
    noEsc:boolean
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export function SideMenuProvider({ children }: { children: ReactNode }) {
    const [ showSideMenu, setShowSideMenu  ] = useState(false);
    const [ red, setRed ] = useState<boolean>(false);
    const [ showHabitMenu, setShowHabitMenu ] = useState(false)
    const [ showSettings, setShowSettings ] = useState(false)
    const [ showJurnal, setShowJurnal ] = useState(false)
    const [ noEsc, setNoEsc ] = useState(false)
    const location = useLocation();

    useEffect(() => {
        setShowSideMenu(false);
    }, [location.pathname]);

    const returnSlide = () => {
        if (showJurnal) setShowJurnal(false)
        else if (showSettings) setShowSettings(false)
        else setShowHabitMenu(false)
    }

    return (
        <SideMenuContext.Provider value={{ showSideMenu, setShowSideMenu, red, setRed, showHabitMenu, setShowHabitMenu, showSettings, setShowSettings, showJurnal, setShowJurnal, returnSlide, setNoEsc, noEsc }}>
            {children}
        </SideMenuContext.Provider>
    );
}
export default SideMenuContext
