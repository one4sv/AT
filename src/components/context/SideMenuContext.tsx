import { createContext, useState, useEffect, type ReactNode, type SetStateAction, useRef } from "react";
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
    setDontHandleOther: React.Dispatch<SetStateAction<boolean>>,
    closeMenu: () => void,
    toggleMenu: () => void,
    openMenu: () => void,

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
    const animationFrame = useRef<number | null>(null);

    const isInitial = useRef(true)
    const location = useLocation();

    useEffect(() => {
        setRed(false)
    }, [location.pathname])

    const closeMenu = () => {
        if (isInitial.current === true) isInitial.current = false;

        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);

        const start = translateX;
        const target = -100;
        const duration = 400;
        const startTime = performance.now();

        if (animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
        }

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = start + (target - start) * eased;

            setTranslateX(next);

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                animationFrame.current = null;
                setShowSideMenu(false); // только после завершения анимации
            }
        };

        animationFrame.current = requestAnimationFrame(animate);
    };
    
    useEffect(() => {
        if (isInitial.current === false) closeMenu()
    }, [location.pathname]);

    const openMenu = () => {
        setShowSideMenu(true);
        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);

        const start = translateX;
        const target = 0;
        const duration = 400;
        const startTime = performance.now();

        if (animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
        }

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = start + (target - start) * eased;

            setTranslateX(next);

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                animationFrame.current = null;
            }
        };

        animationFrame.current = requestAnimationFrame(animate);
    };

    const toggleMenu = () => {
        if (!isDragging) return;

        setDontHandleOther(false);
        setIsDragging(false);

        const target = translateX > -50 ? 0 : -100;
        const start = translateX;
        const duration = 400;
        const startTime = performance.now();

        if (animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
        }

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = start + (target - start) * eased;

            setTranslateX(next);

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                animationFrame.current = null;
                if (target === -100) {
                    setShowSideMenu(false);
                } else {
                    setShowSideMenu(true);
                }
            }
        };

        animationFrame.current = requestAnimationFrame(animate);
    };
        
    const returnSlide = () => {
        if (showJurnal) setShowJurnal(false)
        else if (showSettings) setShowSettings(false)
        else if (showChatMenu) setShowChatMenu(false)
        else setShowHabitMenu(false)
    }

    return (
        <SideMenuContext.Provider value={{ showSideMenu, setShowSideMenu, red, setRed, showHabitMenu, setShowHabitMenu, showSettings, setShowSettings, showChatMenu, setShowChatMenu,
            showJurnal, setShowJurnal, returnSlide, activeTab, setActiveTab, setTranslateX, translateX, setIsDragging, isDragging, dontHandle, setDontHandle, setDontHandleOther, dontHandleOther,
            messageSelectedValue, setMessageSelectedValue, habitsSelectedValue, setHabitsSelectedValue , closeMenu, toggleMenu, openMenu
        }}>
            {children}
        </SideMenuContext.Provider>
    );
}
export default SideMenuContext
