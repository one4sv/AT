import { createContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import type { Habit } from "./HabitsContext"
import type { Media } from "./ChatContext"
const ContextMenuContext = createContext<ContextMenuContextType | null>(null)

type MenuOptions = {
    id: string,
    isDone?: boolean,
    name?:string,
    red?:boolean,
    nick?:string,
    isMy?:boolean,
    func?: () => void,
    url?:string,
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
    sender?:string,
    files?:Media[],
    previewText:string
}

type MenuState = {
    x: number,
    y: number,
    point: string,
    visible: boolean,
    habit?:Habit,
    options: MenuOptions,
    chatInfo?:chatInfoType,
    curChat?:curChatType,
    memberInfo?:MemberType,
}
type MemberType = {
    isMe?:boolean,
    role:string | null,
}
export type ContextMenuContextType = {
    menu: MenuState
    openMenu: (x: number, y: number, point: string, options: MenuOptions, habit?:Habit, chatInfo?:chatInfoType, curChat?:curChatType, memberInfo?:MemberType  ) => void
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

    const openMenu = (x:number, y:number, point:string, options:MenuOptions, habit?:Habit, chatInfo?:chatInfoType, curChat?:curChatType, memberInfo?:MemberType ) => {
        setMenu({ x, y, point, habit, options, chatInfo, visible: true, curChat, memberInfo })
    }

    const closeMenu = () => {
        setMenu({ x: -1000, visible: false, y: 0, point: "", options: {id: "", name: ""}})
    }

    useEffect(() => {
        const close = () => closeMenu()
        window.addEventListener("click", close)
        document.addEventListener("scroll", close, true)

        return () => {
            window.removeEventListener("click", close)
            document.removeEventListener("scroll", close, true)
        }
    }, [])

    return (
        <ContextMenuContext.Provider value={{ menu, openMenu, closeMenu, menuRef }}>
            {children}
        </ContextMenuContext.Provider>
    )
}

export default ContextMenuContext
