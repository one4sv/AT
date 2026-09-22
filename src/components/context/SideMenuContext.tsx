import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
    type SetStateAction,
    useRef,
    useCallback,
} from "react";
import { useLocation } from "react-router-dom";

export type tab = "chats" | "habits" | "spots" | "user";

interface SideMenuContextType {
    showSideMenu: boolean;
    setShowSideMenu: React.Dispatch<SetStateAction<boolean>>;
    red: boolean;
    setRed: React.Dispatch<SetStateAction<boolean>>;
    showHabitMenu: boolean;
    setShowHabitMenu: React.Dispatch<SetStateAction<boolean>>;
    showSettings: boolean;
    setShowSettings: React.Dispatch<SetStateAction<boolean>>;
    showJurnal: boolean;
    setShowJurnal: React.Dispatch<SetStateAction<boolean>>;
    showChatMenu: boolean;
    setShowChatMenu: React.Dispatch<SetStateAction<boolean>>;
    returnSlide: () => void;
    activeTab: tab;
    setActiveTab: React.Dispatch<SetStateAction<tab>>;
    messageSelectedValue: string;
    setMessageSelectedValue: React.Dispatch<SetStateAction<string>>;
    habitsSelectedValue: string;
    setHabitsSelectedValue: React.Dispatch<SetStateAction<string>>;
    translateX: number;
    setTranslateX: React.Dispatch<SetStateAction<number>>;
    isDragging: boolean;
    setIsDragging: React.Dispatch<SetStateAction<boolean>>;
    dontHandle: boolean;
    setDontHandle: React.Dispatch<SetStateAction<boolean>>;
    dontHandleOther: boolean;
    setDontHandleOther: React.Dispatch<SetStateAction<boolean>>;
    closeMenu: () => void;
    toggleMenu: () => void;
    openSideMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export function SideMenuProvider({ children }: { children: ReactNode }) {
    const [showSideMenu, setShowSideMenu] = useState(true);
    const [red, setRed] = useState(false);
    const [showHabitMenu, setShowHabitMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showJurnal, setShowJurnal] = useState(false);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [activeTab, setActiveTab] = useState<tab>("chats");
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dontHandle, setDontHandle] = useState(false);
    const [dontHandleOther, setDontHandleOther] = useState(false);
    const [messageSelectedValue, setMessageSelectedValue] = useState("");
    const [habitsSelectedValue, setHabitsSelectedValue] = useState("");

    // Актуальные значения всегда в refs — нет stale closure
    const translateXRef = useRef(0);
    const animationFrame = useRef<number | null>(null);
    const isInitial = useRef(true);
    const location = useLocation();

    // Синхронизируем ref при любом изменении translateX
    useEffect(() => {
        translateXRef.current = translateX;
    }, [translateX]);

    useEffect(() => {
        setRed(false);
    }, [location.pathname]);

    // Единая функция анимации
    const animateTo = useCallback((target: number, onComplete?: () => void) => {
        if (animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
        }

        const start = translateXRef.current; // всегда актуальное значение
        const duration = 320; // чуть быстрее и стабильнее
        const startTime = performance.now();

        // Если уже почти на месте — сразу завершаем
        if (Math.abs(start - target) < 0.5) {
            setTranslateX(target);
            translateXRef.current = target;
            onComplete?.();
            return;
        }

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            // cubic out
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = start + (target - start) * eased;

            translateXRef.current = next;
            setTranslateX(next);

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                animationFrame.current = null;
                translateXRef.current = target;
                setTranslateX(target);
                onComplete?.();
            }
        };

        animationFrame.current = requestAnimationFrame(animate);
    }, []);

    const closeMenu = useCallback(() => {
        if (isInitial.current) isInitial.current = false;

        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);

        animateTo(-100, () => {
            setShowSideMenu(false);
        });
    }, [animateTo]);

    const openSideMenu = useCallback(() => {
        setShowSideMenu(true);
        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);

        animateTo(0);
    }, [animateTo]);

    const toggleMenu = useCallback(() => {
        setDontHandleOther(false);
        setIsDragging(false);

        const current = translateXRef.current;
        const target = current > -50 ? 0 : -100;

        animateTo(target, () => {
            setShowSideMenu(target === 0);
        });
    }, [animateTo]);

    useEffect(() => {
        if (!isInitial.current) {
            closeMenu();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const returnSlide = () => {
        if (showJurnal) setShowJurnal(false);
        else if (showSettings) setShowSettings(false);
        else if (showChatMenu) setShowChatMenu(false);
        else setShowHabitMenu(false);
    };


    return (
        <SideMenuContext.Provider
            value={{
                showSideMenu,
                setShowSideMenu,
                red,
                setRed,
                showHabitMenu,
                setShowHabitMenu,
                showSettings,
                setShowSettings,
                showChatMenu,
                setShowChatMenu,
                showJurnal,
                setShowJurnal,
                returnSlide,
                activeTab,
                setActiveTab,
                setTranslateX,
                translateX,
                setIsDragging,
                isDragging,
                dontHandle,
                setDontHandle,
                setDontHandleOther,
                dontHandleOther,
                messageSelectedValue,
                setMessageSelectedValue,
                habitsSelectedValue,
                setHabitsSelectedValue,
                closeMenu,
                toggleMenu,
                openSideMenu,
            }}
        >
            {children}
        </SideMenuContext.Provider>
    );
}

export default SideMenuContext;