import { createContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import type { Habit } from "./HabitsContext"
import type { Media } from "./ChatContext"
import type { Perms } from "./GroupContext"
import { useSettings } from "../hooks/SettingsHook";
import useLongPressContextMenu from "../hooks/utils/useLongPressContextMenu"
const ContextMenuContext = createContext<ContextMenuContextType | null>(null)

export type MenuOptions = {
    id: string,
    lastMessage?: {
        text: string;
        sender?: string;
        senderId?: string;
        avatar?: string;
        image?: string;
        files?: Media[];
        mine: boolean;
        forwardedBy?: string;
        entity?: { kind: "user" | "habit" | "plan" | "post" | "group"; id: string };
    },
    anchorRight?: boolean,
    isDone?: boolean,
    name?:string,
    red?:boolean,
    nick?:string,
    isMy?:boolean,
    func?: () => void,
    url?:string,
    type?:string,
    postHeader?: boolean,
    onCopy?: () => void,
    onCopyLink?: () => void,
    onOpen?: () => void,
    onApply?: () => void,
    onShare?: () => void,
    onForward?: () => void,
    onReply?: () => void,
    onEdit?: () => void,
    onDelete?: () => void,
    onDuplicate?: () => void,
    canDuplicate?: boolean,
    onSave?: () => void,
    onStopEdit?: () => void,
    onToggleCancel?: () => void,
    onConfirmDelete?: () => void,
    disabled?: boolean,
    pinned?: boolean,
    completed?: boolean,
    canPin?: boolean,
    canComplete?: boolean,
    shareToken?: string,
    habitId?: string,
}
export interface chatInfoType {
    note:boolean,
    is_blocked:boolean,
    pinned:boolean,
    is_group?:boolean,
}
export interface curChatType {
    isReacted?:string,
    isMy?:boolean,
    text?:string,
    selectableText?: string,
    sender?:string,
    files?:Media[],
    previewText:string,
    is_pinned?:boolean
}
type MenuState = {
    x: number,
    y: number,
    point: string,
    visible: boolean,
    originSide?: { left: number; right: number },
    focusSource?: HTMLElement,
    focusRect?: { width: number; height: number },
    habit?:Habit,
    options: MenuOptions,
    chatInfo?:chatInfoType,
    curChat?:curChatType,
    memberInfo?:MemberType,
}
type MemberType = {
    isMe?:boolean,
    myPerms?:Perms | null
}
export type ContextMenuContextType = {
    menu: MenuState
    openMenu: (x: number, y: number, point: string, options: MenuOptions, habit?:Habit, chatInfo?:chatInfoType, curChat?:curChatType, memberInfo?:MemberType) => void
    closeMenu: () => void,
    menuRef:RefObject<HTMLDivElement | null>
}

export function ContextMenuProvider({ children }:{ children: ReactNode }) {
    const [menu, setMenu] = useState<MenuState>({
        x: -1000,
        y: 0,
        point: "",
        options: {id: "", name: ""},
        visible: false,
    })
    const menuRef = useRef<HTMLDivElement>(null);
    const edgeSourceRef = useRef<HTMLElement | null>(null);

    const openMenu = (x:number, y:number, point:string, options:MenuOptions, habit?:Habit, chatInfo?:chatInfoType, curChat?:curChatType, memberInfo?:MemberType ) => {
        window.getSelection()?.removeAllRanges();
        const source = edgeSourceRef.current ?? document.elementFromPoint(x, y);
        const side = source?.closest<HTMLElement>(".sideMenu");
        const bounds = side?.getBoundingClientRect();
        // Header menus open below the header; do not capture the message underneath.
        const isHeaderMenu = ["chatAction", "acc", "profileActions", "headerQuickAction", "habitHeader", "settingsBack", "settingsSection"].includes(point);
        const target = isHeaderMenu || point==="calendarDay" ? null : source?.closest<HTMLElement>("[data-context-menu]");
        const focusSource = window.matchMedia("(pointer: coarse)").matches && target &&
            !target.closest(".headerDiv, [data-header-gesture]") ? target : undefined;
        const focusBounds = focusSource?.getBoundingClientRect();
        setMenu({
            x, y, point, habit, options, chatInfo, visible: true, curChat, memberInfo,
            originSide: bounds ? { left: bounds.left, right: bounds.right } : undefined,
            focusSource,
            focusRect: focusBounds ? { width: focusBounds.width, height: focusBounds.height } : undefined
        })
    }

    const closeMenu = () => {
        setMenu({ x: -1000, visible: false, y: 0, point: "", options: {id: "", name: ""}})
    }

    const { highlightContextEdges } = useSettings();
    useLongPressContextMenu({ closeMenu, menuRef, edgeSourceRef, highlightContextEdges });

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (event.target instanceof Element && event.target.closest(".contextMessageSelectable, .messageWrapper.onContextMenu .messageText, .messageWrapper.onContextMenu .redirectText")) return;
            closeMenu();
        }
        const scroll = (event: Event) => {
            if (event.target instanceof HTMLElement && (event.target.hasAttribute("data-context-edge-scroll") || event.target.closest(".selectableMessagePreview"))) return;
            if (!menuRef.current?.contains(event.target as Node) && !(event.target instanceof Element && event.target.closest(".selectListPortalRoot.calendarContextActivity"))) closeMenu()
        }
        const key = (event: KeyboardEvent) => { if (event.key === "Escape") closeMenu() }
        window.addEventListener("click", close)
        window.addEventListener("keydown", key)
        document.addEventListener("scroll", scroll, true)

        return () => {
            window.removeEventListener("click", close)
            window.removeEventListener("keydown", key)
            document.removeEventListener("scroll", scroll, true)
        }
    }, [])

    return (
        <ContextMenuContext.Provider value={{ menu, openMenu, closeMenu, menuRef }}>
            {children}
        </ContextMenuContext.Provider>
    )
}

export default ContextMenuContext
