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
import { useTranslation } from "react-i18next";
import { useContacts } from "../hooks/ContactsHook";
import { useHabits } from "../hooks/HabitsHook";
import { useSettings } from "../hooks/SettingsHook";
import { filterHabitsByOrder } from "../ts/utils/filteredHabitsByOrder";

export type tab = "chats" | "habits" | "spots" | "user";
export type slides = "settings" | "chat" | "journal" | null;

export type FilterItem = {
    label: string;
    value: string;
    new: string;
};

interface SideMenuContextType {
    settingsSearch: string;
    setSettingsSearch: React.Dispatch<SetStateAction<string>>;
    showSideMenu: boolean;
    setShowSideMenu: React.Dispatch<SetStateAction<boolean>>;
    red: boolean;
    setRed: React.Dispatch<SetStateAction<boolean>>;
    showHabitMenu: boolean;
    setShowHabitMenu: React.Dispatch<SetStateAction<boolean>>;
    showSlide: slides;
    setShowSlide: React.Dispatch<SetStateAction<slides>>;
    activeTab: tab;
    setActiveTab: React.Dispatch<SetStateAction<tab>>;
    messageSelectedValue: string;
    setMessageSelectedValue: React.Dispatch<SetStateAction<string>>;
    habitsSelectedValue: string;
    setHabitsSelectedValue: React.Dispatch<SetStateAction<string>>;
    chatsFilters: FilterItem[];
    habitsFilters: FilterItem[];
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
    const { t, i18n } = useTranslation("common");
    const { list } = useContacts()
    const { habits, newOrderHabits } = useHabits()
    const { showArchived } = useSettings();

    const [showSideMenu, setShowSideMenu] = useState(true);
    const [red, setRed] = useState(false);
    const [showHabitMenu, setShowHabitMenu] = useState(false);
    const [showSlide, setShowSlide] = useState<slides>(null);
    const [activeTab, setActiveTab] = useState<tab>("chats");
    const [settingsSearch, setSettingsSearch] = useState("");
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dontHandle, setDontHandle] = useState(false);
    const [dontHandleOther, setDontHandleOther] = useState(false);
    const [messageSelectedValue, setMessageSelectedValue] = useState("chats");
    const [habitsSelectedValue, setHabitsSelectedValue] = useState("all");

    // === ФИЛЬТРЫ ===
    const [chatsFilters, setChatsFilters] = useState<FilterItem[]>([]);
    const [habitsFilters, setHabitsFilters] = useState<FilterItem[]>([]);

    const newLength = list.filter(
        (c) => c.unread_count > 0 && !c.is_blocked && c.note
    ).length;

    // Фильтры чатов
    useEffect(() => {
        const filters: FilterItem[] = [];

        const totalNew = newLength > 99 ? "99+" : newLength > 0 ? String(newLength) : "";
        filters.push({ label: "Все", value: "chats", new: totalNew });

        if (newLength > 0) {
            filters.push({ label: t("sideMenu.new"), value: "new", new: totalNew });
        }

        const privateChats = list.filter((c) => !c.is_group);
        if (privateChats.length > 0) {
            const privateNewCount = privateChats.filter(
                (c) => c.unread_count > 0 && !c.is_blocked && c.note
            ).length;
            const privateNew =
                privateNewCount > 99 ? "99+" : privateNewCount > 0 ? String(privateNewCount) : "";
            filters.push({
                label: t("sideMenu.private"),
                value: "private",
                new: privateNew,
            });
        }

        const groupChats = list.filter((c) => c.is_group);
        if (groupChats.length > 0) {
            const groupNewCount = groupChats.filter(
                (c) => c.unread_count > 0 && !c.is_blocked && c.note
            ).length;
            const groupNew =
                groupNewCount > 99 ? "99+" : groupNewCount > 0 ? String(groupNewCount) : "";
            filters.push({
                label: t("sideMenu.groups"),
                value: "group",
                new: groupNew,
            });
        }

        setChatsFilters(filters);

        if (!filters.some((f) => f.value === messageSelectedValue)) {
            setMessageSelectedValue(filters[0]?.value ?? "chats");
        }
    }, [list, newLength, t, i18n.language, messageSelectedValue]);

    // Фильтры привычек
    useEffect(() => {
        const filters: FilterItem[] = [];
        filters.push({ label: "Все", value: "all", new: "0" });

        if (newOrderHabits && habits) {
            const groupLabels: Record<string, string> = {
                everyday: t("sideMenu.everyday"),
                today: t("sideMenu.today"),
                tomorrow: t("sideMenu.tomorrow"),
                sometimes: t("sideMenu.sometimes"),
            };

            const activeHabits = habits.filter((h) => h.ongoing);

            newOrderHabits.forEach((order) => {
                if (order === "pinned") return;

                const groupHabits = filterHabitsByOrder(order, activeHabits, "");
                if (groupHabits.length > 0) {
                    let label = groupLabels[order];
                    if (!label) {
                        const date = new Date(order);
                        if (!isNaN(date.getTime())) {
                            label = date.toLocaleDateString(
                                i18n.language === "ru" ? "ru-RU" : undefined,
                                {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "numeric",
                                }
                            );
                        } else {
                            return;
                        }
                    }
                    filters.push({ label, value: order, new: "0" });
                }
            });

            if (habits.some((h) => !h.ongoing)) {
                filters.push({
                    label: t("sideMenu.archive"),
                    value: "archived",
                    new: "0",
                });
            }
        }

        setHabitsFilters(filters);

        if (!filters.some((f) => f.value === habitsSelectedValue)) {
            setHabitsSelectedValue(filters[0]?.value ?? "all");
        }
    }, [habits, newOrderHabits, showArchived, t, i18n.language, habitsSelectedValue]);

    // === остальной код (анимация и т.д.) без изменений ===
    const translateXRef = useRef(0);
    const animationFrame = useRef<number | null>(null);
    const previousPath = useRef<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        translateXRef.current = translateX;
    }, [translateX]);

    useEffect(() => {
        setRed(false);
    }, [location.pathname]);

    const animateTo = useCallback((target: number, onComplete?: () => void) => {
        if (animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
        }

        const start = translateXRef.current;
        const duration = 320;
        const startTime = performance.now();

        if (Math.abs(start - target) < 0.5) {
            setTranslateX(target);
            translateXRef.current = target;
            onComplete?.();
            return;
        }

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
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
        if (previousPath.current === null) {
            previousPath.current = location.pathname;
            if (location.pathname.startsWith("/info")) closeMenu();
            return;
        }
        if (previousPath.current !== location.pathname) {
            previousPath.current = location.pathname;
            closeMenu();
        }
    }, [location.pathname, closeMenu]);

    return (
        <SideMenuContext.Provider
            value={{
                settingsSearch,
                setSettingsSearch,
                showSideMenu,
                setShowSideMenu,
                red,
                setRed,
                showHabitMenu,
                setShowHabitMenu,
                showSlide,
                setShowSlide,
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
                chatsFilters,
                habitsFilters,
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
