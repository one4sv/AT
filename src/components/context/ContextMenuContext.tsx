import { createContext, useEffect, useState, type ReactNode } from "react";
import type { Habit } from "./HabitsContext";
const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

type MenuOptions = {
    id: string;
    isDone?: boolean;
    name?:string;
    red?:boolean;
    func?: () => void;
};

type MenuState = {
    x: number;
    y: number;
    point: string;
    habit?:Habit;
    options?: MenuOptions;
    visible: boolean;
};

export type ContextMenuContextType = {
    menu: MenuState;
    openMenu: (x: number, y: number, point: string, habit?:Habit, options?: MenuOptions) => void;
    closeMenu: () => void;
};


export function ContextMenuProvider({ children }:{ children: ReactNode }) {
    const [menu, setMenu] = useState<MenuState>({
        x: -1000,
        y: 0,
        point: "",
        options: {id: "" },
        visible: false,
    });

    const openMenu = (x:number, y:number, point:string, habit:Habit | undefined, options:MenuOptions | undefined) => {
        setMenu({ x, y, point, habit, options, visible: true });
    };

    const closeMenu = () => {
        setMenu((m) => ({ ...m, visible: false }));
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
