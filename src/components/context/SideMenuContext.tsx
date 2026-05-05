import { createContext, useState, useEffect, type ReactNode, type SetStateAction } from "react";
import { useLocation } from "react-router-dom";

interface SideMenuContextType {
    showSideMenu: boolean;
    setShowSideMenu:React.Dispatch<SetStateAction<boolean>>,
    red:boolean,
    setRed:React.Dispatch<SetStateAction<boolean>>,
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export function SideMenuProvider({ children }: { children: ReactNode }) {
    const [ showSideMenu, setShowSideMenu  ] = useState(false);
    const [ red, setRed ] = useState<boolean>(false);
    
    const location = useLocation();

    useEffect(() => {
        setShowSideMenu(false);
    }, [location.pathname]);

    return (
        <SideMenuContext.Provider value={{ showSideMenu, setShowSideMenu, red, setRed }}>
            {children}
        </SideMenuContext.Provider>
    );
}
export default SideMenuContext
