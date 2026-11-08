import { createContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { ReactNode, SetStateAction } from "react";
import axios from "axios";
import { useUser } from "../hooks/UserHook";
import useLocalStorage from "../hooks/utils/useLocalStorage";
import i18n from "../../i18n/i18n";
import { api } from "../ts/api";
import { applyCustomPalette } from "../ts/utils/customPalette";
import { defaultBackgroundEffects, hasCachedBackgroundEffects, normalizeBackgroundEffects } from "../ts/utils/backgroundEffects";
import { MAX_CUSTOM_BACKGROUNDS } from "../ts/utils/backgroundCatalog";

const SettingsContext = createContext<SettingsContextType | null>(null);

export type GroupInviteRules = { contacts: "direct" | "message" | "none"; others: "direct" | "message" | "none" };
export type ChatWelcomeSettings = { enabled: boolean; text: string };
export type QuickActionType = "feed" | "settings" | "profile" | "habits" | "habit" | "chat";
export type QuickAction = { type: QuickActionType; target?: string; label?: string };
export type SavedBackground = { url: string; path: string | null };
export type ContourPattern = "order" | "chaos";
export type WallpaperStyle = {
    logoEnabled: boolean;
    fillMode: "solid" | "gradient";
    fillColor: string;
    fillGrad: string;
    logoMode: "solid" | "gradient";
    logoColor: string;
    logoGrad: string;
    logoGlow: number;
};

export type BackgroundEffects = {
    blur: number;
    movement: boolean;
    filter: "none" | "grayscale" | "sepia" | "invert" | "contrast" | "saturate";
    speed: number;
};

export interface SettingsContextType {
    groupInvites: GroupInviteRules;
    chatWelcome: ChatWelcomeSettings;
    quickActions: QuickAction[];
    setQuickActions: React.Dispatch<React.SetStateAction<QuickAction[]>>;
    setChatWelcome: React.Dispatch<React.SetStateAction<ChatWelcomeSettings>>;
    orderHabits: string[  ] | null;
    setOrderHabits: React.Dispatch<React.SetStateAction<string[  ] | null>>;
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    accent: string;
    setAccent: React.Dispatch<React.SetStateAction<string>>;    
    grad: string;
    setGrad: React.Dispatch<React.SetStateAction<string>>;    
    blur: number;
    setBlur: React.Dispatch<React.SetStateAction<number>>;    
    layout: string;
    setLayout: React.Dispatch<React.SetStateAction<string>>;
    bg: string;
    setBg: React.Dispatch<React.SetStateAction<string>>;
    decor: string;
    setDecor: React.Dispatch<React.SetStateAction<string>>;    
    fontSize: number;
    setFontSize: React.Dispatch<React.SetStateAction<number>>;
    dateFormat: "standart" | "american";
    setDateFormat: React.Dispatch<React.SetStateAction<"standart" | "american">>;
    timeFormat: "twentyFour" | "twelve";
    setTimeFormat: React.Dispatch<React.SetStateAction<"twentyFour" | "twelve">>;
    lang:string,
    setLang: React.Dispatch<React.SetStateAction<string>>;    
    emote: string;
    setEmote: React.Dispatch<React.SetStateAction<string>>;    
    messdb: string;
    setMessdb: React.Dispatch<React.SetStateAction<string>>;
    twoAuth: boolean | null;
    setTwoAuth: React.Dispatch<React.SetStateAction<boolean | null>>;
    autoLoadImages: boolean;
    setAutoLoadImages: React.Dispatch<React.SetStateAction<boolean>>;
    autoPlayGif: boolean;
    setAutoPlayGif: React.Dispatch<React.SetStateAction<boolean>>;
    useImageCache: boolean;
    setUseImageCache: React.Dispatch<React.SetStateAction<boolean>>;
    note: boolean;
    setNote: React.Dispatch<React.SetStateAction<boolean>>;    
    habitsNote: boolean;
    setHabitsNote: React.Dispatch<React.SetStateAction<boolean>>;
    messNote: boolean;
    setMessNote: React.Dispatch<React.SetStateAction<boolean>>;
    bgUrl: string;
    setBgUrl: React.Dispatch<React.SetStateAction<string>>;
    bgGallery: SavedBackground[];
    setBgGallery: React.Dispatch<React.SetStateAction<SavedBackground[]>>;
    bgEffects: BackgroundEffects;
    wallpaperStyle: WallpaperStyle;
    setWallpaperStyle: React.Dispatch<React.SetStateAction<WallpaperStyle>>;
    bgEffectsReady: boolean;
    contourPattern: ContourPattern;
    contourSize: number;
    artPattern: ContourPattern;
    setArtPattern: React.Dispatch<React.SetStateAction<ContourPattern>>;
    artSize: number;
    setArtSize: React.Dispatch<React.SetStateAction<number>>;
    setContourSize: React.Dispatch<React.SetStateAction<number>>;
    setContourPattern: React.Dispatch<React.SetStateAction<ContourPattern>>;
    setBgEffects: React.Dispatch<React.SetStateAction<BackgroundEffects>>;
    privateShow: PrivateSettings;
    setPrivate: React.Dispatch<React.SetStateAction<PrivateSettings>>;
    tab: string;
    setTab: React.Dispatch<React.SetStateAction<string>>;
    showArchived: boolean;
    setShowArchived: React.Dispatch<SetStateAction<boolean>>;
    showArchivedInAcc: boolean;
    setShowArchivedInAcc: React.Dispatch<SetStateAction<boolean>>;
    weekStart: string | null;
    setWeekStart: React.Dispatch<React.SetStateAction<string | null>>;
    refetchSettings: () => Promise<void>;
    isDark:boolean,
    settingsLoaded: boolean;
}

interface SettingsResponse {
    group_invites: GroupInviteRules;
    chat_welcome?: ChatWelcomeSettings;
    quick_actions?: QuickAction[];
    success: boolean;
    order: string[  ];
    private: PrivateSettings;
    twoAuth: boolean;
    all_note: boolean;
    new_mess_note: boolean;
    show_archived: boolean;
    show_archived_in_acc: boolean;
    week_start: string;
    bg_gallery?: SavedBackground[];
    bg_effects?: BackgroundEffects;
}

export interface PrivateSettings {
    number: string;
    mail: string;
    habits: string;
    posts: string;
    activity_invites?: string;
    activity_invite_exceptions?: Record<string, "allow" | "deny" | "invert">;
    group_invite_exceptions?: Record<string, "allow" | "deny" | "invert">;
}

const LOCAL_KEYS = {
    theme: "settings_theme",
    accent: "settings_accent",
    grad: "settings_grad",
    blur: "settings_blur",
    layout: "settings_layout",
    bg: "settings_bg",
    bgUrl: "settings_bg_url",
    bgEffects: "settings_bg_effects",
    wallpaperStyle: "settings_wallpaper_style",
    contourPattern: "settings_contour_pattern",
    contourSize: "settings_contour_size",
    artPattern: "settings_art_pattern",
    artSize: "settings_art_size",
    decor: "settings_decor",
    emote:"settings_emote",
    messdb:"settings_messdb",
    autoLoadImages: "settings_auto_load_images",
    autoPlayGif: "settings_auto_play_gif",
    useImageCache: "settings_use_image_cache",
    note:"settings_note",
    messnote:"settings_messnote",
    habitsnote:"settings_habitsnote",
    lang:"settings_lang",
    fontSize:"settings_font_size",
    dateFormat:"settings_date_format",
    timeFormat:"settings_time_format"
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { user, initialLoading } = useUser();

    const [ theme, setTheme ] = useLocalStorage(LOCAL_KEYS.theme, "system");
    const [ accent, setAccent ] = useLocalStorage(LOCAL_KEYS.accent, "poison");
    const [ grad, setGrad ] = useLocalStorage(LOCAL_KEYS.grad, "meadow");
    const [ blur, setBlur ] = useLocalStorage(LOCAL_KEYS.blur, 6);
    const [ layout, setLayout ] = useLocalStorage(LOCAL_KEYS.layout, "always");
    const [ bg, setBg ] = useLocalStorage(LOCAL_KEYS.bg, "landing");
    const [ contourPattern, setContourPattern ] = useLocalStorage<ContourPattern>(LOCAL_KEYS.contourPattern, "order");
    const [ contourSize, setContourSize ] = useLocalStorage<number>(LOCAL_KEYS.contourSize, 1);
    const [ artPattern, setArtPattern ] = useLocalStorage<ContourPattern>(LOCAL_KEYS.artPattern, "order");
    const [ artSize, setArtSize ] = useLocalStorage<number>(LOCAL_KEYS.artSize, 1);
    const [ storedBgEffects, setStoredBgEffects ] = useLocalStorage<BackgroundEffects>(LOCAL_KEYS.bgEffects, defaultBackgroundEffects);
    const [ wallpaperStyle, setWallpaperStyle ] = useLocalStorage<WallpaperStyle>(LOCAL_KEYS.wallpaperStyle, {
        fillMode: "solid",
        logoEnabled: false,
        fillColor: "#151515",
        fillGrad: "#303030",
        logoMode: "gradient",
        logoColor: "#f5f2ff",
        logoGrad: "#916cf2",
        logoGlow: 32
    });
    // Migrate the old blue-tinted built-in defaults without overriding user palettes.
    useEffect(() => {
        if (wallpaperStyle.fillColor === "#101018" && wallpaperStyle.fillGrad === "#303052") {
            setWallpaperStyle(current => ({
                ...current, fillColor: "#151515", fillGrad: "#303030"
            }));
        }
    }, [wallpaperStyle.fillColor, wallpaperStyle.fillGrad, setWallpaperStyle]);

    useEffect(() => {
        if (bg === "logo" && !wallpaperStyle.logoEnabled) {
            setWallpaperStyle(current => ({ ...current, logoEnabled: true }));
        }
    }, [bg, wallpaperStyle.logoEnabled, setWallpaperStyle]);

    const bgEffects = useMemo(() => normalizeBackgroundEffects(storedBgEffects), [storedBgEffects]);
    const setBgEffects = useCallback<React.Dispatch<React.SetStateAction<BackgroundEffects>>>(next => {
        setStoredBgEffects(previous => normalizeBackgroundEffects(
            typeof next === "function" ? next(normalizeBackgroundEffects(previous)) : next
        ));
    }, [setStoredBgEffects]);
    const hasLocalBgEffects = useMemo(() => hasCachedBackgroundEffects(user.nick, initialLoading), [user.nick, initialLoading]);
    const hydratedBgEffectsFor = useRef<string | null>(null);
    const [ decor, setDecor ] = useLocalStorage(LOCAL_KEYS.decor, "glass");
    const [ lang, setLang ] = useLocalStorage(LOCAL_KEYS.lang, "ru");
    const [ fontSize, setFontSize ] = useLocalStorage<number>(LOCAL_KEYS.fontSize, 16);
    const [ dateFormat, setDateFormat ] = useLocalStorage<"standart" | "american">(LOCAL_KEYS.dateFormat, "standart");
    const [ timeFormat, setTimeFormat ] = useLocalStorage<"twentyFour" | "twelve">(LOCAL_KEYS.timeFormat, "twentyFour");

    useEffect(() => {
        const safeSize = Number.isFinite(fontSize) ? Math.max(12, Math.min(22, fontSize)) : 16;
        document.documentElement.style.fontSize = `${safeSize}px`;
        document.documentElement.style.setProperty("--app-font-size", `${safeSize}px`);
        document.documentElement.style.setProperty("--app-font-scale", String(safeSize / 16));
        document.documentElement.dataset.dateFormat = dateFormat;
        document.documentElement.dataset.timeFormat = timeFormat;
    }, [fontSize, dateFormat, timeFormat]);
    const [ emote, setEmote ] = useLocalStorage(LOCAL_KEYS.emote, "Heart")
    const [ messdb, setMessdb ] = useLocalStorage(LOCAL_KEYS.messdb, "reaction")
    const [ autoLoadImages, setAutoLoadImages ] = useLocalStorage(LOCAL_KEYS.autoLoadImages, true);
    const [ autoPlayGif, setAutoPlayGif ] = useLocalStorage(LOCAL_KEYS.autoPlayGif, true);
    const [ useImageCache, setUseImageCache ] = useLocalStorage(LOCAL_KEYS.useImageCache, true);
    const [ note, setNote ] = useLocalStorage(LOCAL_KEYS.note, true);
    const [ messNote, setMessNote ] = useLocalStorage(LOCAL_KEYS.messnote, true);
    const [ habitsNote, setHabitsNote ] = useLocalStorage(LOCAL_KEYS.habitsnote, true);

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark =
        theme === "dark" ||
        (theme === "system" && systemDark);

    const [ orderHabits, setOrderHabits ] = useState<string[  ] | null>(null);
    const [ bgUrl, setBgUrl ] = useLocalStorage(LOCAL_KEYS.bgUrl, (() => {
        try {
            // Migrate the previous device-only key without reading a selected URL from the API.
            const value = JSON.parse(localStorage.getItem("settings_bg_url") ?? '""');
            return typeof value === "string" ? value : "";
        } catch {
            return "";
        }
    })());
    const [ bgGallery, setBgGallery ] = useState<SavedBackground[]>([]);
    const [ groupInvites, setGroupInvites ] = useState<GroupInviteRules>({ contacts: "message", others: "none" });
    const [ chatWelcome, setChatWelcome ] = useState<ChatWelcomeSettings>({ enabled: false, text: "" });
    const [ quickActions, setQuickActions ] = useState<QuickAction[]>([]);
    const [ twoAuth, setTwoAuth ] = useState<boolean | null>(null);
    const [ privateShow, setPrivate ] = useState<PrivateSettings>({ number: "", mail: "", habits: "", posts: "" });
    const [ showArchived, setShowArchived ] = useState<boolean>(false);
    const [ showArchivedInAcc, setShowArchivedInAcc ] = useState<boolean>(false);
    const [ weekStart, setWeekStart ] = useState<string | null>(null);
    const [ tab, setTab ] = useState<string>('menu');
    const [ loadedSettingsFor, setLoadedSettingsFor ] = useState<string | null>(null);
    const settingsLoaded = !initialLoading && (!user.nick || loadedSettingsFor === user.nick);
    const bgEffectsReady = hasLocalBgEffects || settingsLoaded;

    useEffect(() => {
        void import("../ts/utils/wallpaperCache").then(({ configureWallpaperCache }) => {
            const selected = localStorage.getItem("settings_use_image_cache");
            return configureWallpaperCache(selected === null || selected === "true");
        });
    }, [useImageCache]);

    useEffect(() => {
        i18n.changeLanguage(lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const refetchSettings = useCallback(async () => {
        try {
            const res = await api.get<SettingsResponse>(`settings`);

            if (res.data.success) {
                setOrderHabits(res.data.order ?? [ "everyday", "weekly", "sometimes" ]);
                setGroupInvites(res.data.group_invites ?? { contacts: "message", others: "none" });
                setChatWelcome(res.data.chat_welcome ?? { enabled: false, text: "" });
                setQuickActions(Array.isArray(res.data.quick_actions) ? res.data.quick_actions.slice(0, 3) : []);
                setPrivate(res.data.private ?? { number: "contacts", mail: "contacts", habits: "all", posts: "all" });
                setTwoAuth(res.data.twoAuth ?? false);
                setNote(res.data.all_note ?? true);
                setMessNote(res.data.new_mess_note ?? true);
                setShowArchived(res.data.show_archived ?? false);
                setShowArchivedInAcc(res.data.show_archived_in_acc ?? false);
                setWeekStart(res.data.week_start ?? null);
                setBgGallery(Array.isArray(res.data.bg_gallery) ? res.data.bg_gallery.slice(0, MAX_CUSTOM_BACKGROUNDS) : []);
                if (hydratedBgEffectsFor.current !== user.nick) {
                    if (!hasLocalBgEffects) setBgEffects(normalizeBackgroundEffects(res.data.bg_effects));
                    hydratedBgEffectsFor.current = user.nick;
                }
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) return;
            console.error("Ошибка загрузки настроек:", err);
        }
    }, [setMessNote, setNote, setBgEffects, hasLocalBgEffects, user.nick]);

    useEffect(() => {
        if (initialLoading) return;

        if (!user.nick) return;

        const init = async () => {
            try {
                await refetchSettings();
            } finally {
                setLoadedSettingsFor(user.nick);
            }
        };

        init();
    }, [initialLoading, user.nick, refetchSettings]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        document.documentElement.setAttribute("data-accent", accent);
        document.documentElement.setAttribute("data-grad", grad);
        document.documentElement.setAttribute("data-decor", decor);
        applyCustomPalette(accent, grad);
    }, [isDark, accent, grad, decor]);

    return (
        <SettingsContext.Provider value={{
            orderHabits, setOrderHabits, tab, setTab, refetchSettings,
            theme, setTheme,
            accent, setAccent,
            grad, setGrad,
            blur, setBlur,
            layout, setLayout,
            bg, setBg,
            decor, setDecor,
            bgUrl, setBgUrl, bgGallery, setBgGallery, bgEffects, bgEffectsReady, setBgEffects, wallpaperStyle, setWallpaperStyle, contourPattern, setContourPattern, contourSize, setContourSize, artPattern, setArtPattern, artSize, setArtSize, lang, setLang, fontSize, setFontSize, dateFormat, setDateFormat, timeFormat, setTimeFormat,
            privateShow, setPrivate, groupInvites, chatWelcome, setChatWelcome, quickActions, setQuickActions,
            twoAuth, setTwoAuth,
            autoLoadImages, setAutoLoadImages, autoPlayGif, setAutoPlayGif, useImageCache, setUseImageCache,
            note, setNote,
            messNote, setMessNote,
            showArchived, setShowArchived,
            showArchivedInAcc, setShowArchivedInAcc,
            weekStart, setWeekStart,
            setEmote, emote, setMessdb, messdb,
            habitsNote, setHabitsNote, isDark,
            settingsLoaded
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
