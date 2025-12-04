import { createContext, useEffect, useState, type ReactNode } from "react";
import type { Habit } from "./HabitsContext";
const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

type MenuOptions = {
    id: string;
    isDone?: boolean;
    name?:string;
    red?:boolean;
    nick?:string;
    isMy?:boolean;
    func?: () => void;
};
export interface chatInfoType {
    note:boolean,
    is_blocked:boolean,
    pinned:boolean,
}
export interface curChatType {
    isChose:boolean,
    setIsChose:React.Dispatch<React.SetStateAction<boolean>>,
    chosenMess:number[]
    setMess:React.Dispatch<React.SetStateAction<number[]>>,
    isReacted?:string
}

type MenuState = {
    x: number;
    y: number;
    point: string;
    visible: boolean;
    habit?:Habit;
    options: MenuOptions;
    chatInfo?:chatInfoType;
    curChat?:curChatType;
};

export type ContextMenuContextType = {
    menu: MenuState;
    openMenu: (x: number, y: number, point: string, options: MenuOptions, habit?:Habit, chatInfo?:chatInfoType, curChat?:curChatType ) => void;
    closeMenu: () => void;
};


export function ContextMenuProvider({ children }:{ children: ReactNode }) {
    const [menu, setMenu] = useState<MenuState>({
        x: -1000,
        y: 0,
        point: "",
        options: {id: "", name: ""},
        visible: false,
    });

    const openMenu = (x:number, y:number, point:string, options:MenuOptions, habit?:Habit, chatInfo?:chatInfoType, curChat?:curChatType ) => {
        setMenu({ x, y, point, habit, options, chatInfo, visible: true, curChat });
    };

    const closeMenu = () => {
        setMenu({ x: -1000, visible: false, y: 0, point: "", options: {id: "", name: ""}});
    };

    useEffect(() => {
        const close = () => closeMenu();
        window.addEventListener("click", close);

        return () => window.removeEventListener("click", close);
    }, []);

    return (
        <ContextMenuContext.Provider value={{ menu, openMenu, closeMenu }}>
            {children}
        </ContextMenuContext.Provider>
    );
}

export default ContextMenuContext
