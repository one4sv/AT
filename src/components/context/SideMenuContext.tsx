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
import { usePlans } from "../hooks/PlansHook";
import { todayStrFunc } from "../ts/utils/dateToStr";
import { useSettings } from "../hooks/SettingsHook";
import { filterHabitsByOrder } from "../ts/utils/filteredHabitsByOrder";
import useCompactLayout from "../hooks/utils/useCompactLayout";

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
    const { list, search: settingsSearch, setSearch: setSettingsSearch } = useContacts()
    const { habits, newOrderHabits } = useHabits()
    const { plans } = usePlans()
    const { showArchived, layout } = useSettings();
    const isCompact = useCompactLayout();
    const location = useLocation();
    const initiallyClosed = (isCompact || layout === "hidden") &&
        (location.pathname.startsWith("/settings") || location.pathname.startsWith("/info") || location.pathname.startsWith("/wallpapers"));

    const [showSideMenu, setShowSideMenu] = useState(() => initiallyClosed ? false : isCompact || layout !== "hidden");
    const [red, setRed] = useState(false);
    const [showHabitMenu, setShowHabitMenu] = useState(false);
    const [showSlide, setShowSlide] = useState<slides>(null);
    const [activeTab, setActiveTab] = useState<tab>("chats");
    const [translateX, setTranslateX] = useState(() => initiallyClosed ? -100 : isCompact || layout !== "hidden" ? 0 : -100);
    const [isDragging, setIsDragging] = useState(false);
    const [dontHandle, setDontHandle] = useState(false);
    const [dontHandleOther, setDontHandleOther] = useState(false);
    const [messageSelectedValue, setMessageSelectedValue] = useState("chats");
    const [habitsSelectedValue, setHabitsSelectedValue] = useState("all");

    // === ФИЛЬТРЫ ===
    const [chatsFilters, setChatsFilters] = useState<FilterItem[]>([]);
    const [habitsFilters, setHabitsFilters] = useState<FilterItem[]>([]);

    const countUnread = (contacts: typeof list) => contacts.reduce(
        (total, contact) => total + (!contact.is_blocked && contact.note ? contact.unread_count : 0),
        0
    );
    const newLength = countUnread(list);

    // Фильтры чатов
    useEffect(() => {
        const filters: FilterItem[] = [];

        const totalNew = newLength > 99 ? "99+" : newLength > 0 ? String(newLength) : "";
        filters.push({ label: t("sideMenu.all"), value: "chats", new: totalNew });

        if (newLength > 0) {
            filters.push({ label: t("sideMenu.new"), value: "new", new: totalNew });
        }

        const privateChats = list.filter((c) => !c.is_group);
        if (privateChats.length > 0) {
            const privateNewCount = countUnread(privateChats);
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
            const groupNewCount = countUnread(groupChats);
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
        filters.push({ label: t("sideMenu.all"), value: "all", new: "0" });

        if (newOrderHabits) {
            const groupLabels: Record<string, string> = {
                everyday: t("sideMenu.everyday"),
                today: t("sideMenu.today"),
                tomorrow: t("sideMenu.tomorrow"),
                sometimes: t("sideMenu.sometimes"),
            };

            const activeHabits = (habits || []).filter((h) => h.ongoing);

            newOrderHabits.forEach((order) => {
                if (order === "pinned") return;

                const groupHabits = filterHabitsByOrder(order, activeHabits, "");
                const planDate = order === "today" ? todayStrFunc() : order === "tomorrow" ?
                    (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        return [d.getFullYear(), String(d.getMonth() + 1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
                    })() : /^\d{4}-\d{2}-\d{2}$/.test(order) ? order : "";
                const hasPlans = planDate && plans.some(plan =>
                    plan.plan_date === planDate && plan.membership_status !== "pending");
                if (groupHabits.length > 0 || hasPlans) {
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

            if (habits?.some((h) => !h.ongoing)) {
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
    }, [habits, plans, newOrderHabits, showArchived, t, i18n.language, habitsSelectedValue]);

    // === остальной код (анимация и т.д.) без изменений ===
    const translateXRef = useRef(0);
    const animationFrame = useRef<number | null>(null);
    const previousPath = useRef<string | null>(null);

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

    useEffect(() => {
        if (isDragging && animationFrame.current !== null) {
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
        }
    }, [isDragging]);

    useEffect(() => {
        return () => {
            if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
        };
    }, []);

    const closeMenu = useCallback(() => {
        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);
        setShowSideMenu(false);

        animateTo(-100);
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

    // Wallpaper Studio is always a manual overlay on desktop, regardless
    // of settings_layout. Initialize it once on entry and keep user choices.
    const previousMode = useRef<string | null>(null);
    const studio = location.pathname.startsWith("/wallpapers");

    useEffect(() => {
        const mode = studio ? `wallpapers:${isCompact ? "compact" : layout}` : `${isCompact ? "compact" : "desktop"}:${layout}`;
        if (previousMode.current === mode) return;
        previousMode.current = mode;

        if (studio) {
            closeMenu();
            return;
        }
        if (isCompact) return;
        if (layout === "hidden") closeMenu();
        else openSideMenu();
    }, [isCompact, layout, studio, closeMenu, openSideMenu]);

    useEffect(() => {
        if (previousPath.current === null) {
            previousPath.current = location.pathname;
            if (!studio && (location.pathname.startsWith("/info") || location.pathname.startsWith("/settings")) && (isCompact || layout === "hidden")) closeMenu();
            return;
        }
        if (previousPath.current !== location.pathname) {
            previousPath.current = location.pathname;
            if (!studio && (isCompact || layout === "hidden")) closeMenu();
        }
    }, [location.pathname, closeMenu, isCompact, layout, studio]);

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
