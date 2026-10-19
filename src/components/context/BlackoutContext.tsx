import { createContext, useState } from "react";
import { type ReactNode } from "react";

const BlackoutContext = createContext<BlackoutContextType | null>(null);

export interface Blackout {
    seted: boolean;
    module?: string;
    pick?: File;
    bg?: File;
    img?: string;
    point?: string;
    options?: { id?: string; nick?: string; name?: string; url?: string };
    sender?: { id?: string; nick?: string; name?: string; url?: string };
    isRoot?: boolean;
    images?: BlackoutImage[];
    imageIndex?: number;
}

export interface BlackoutContextType {
    blackout: Blackout;
    blackoutStack: Blackout[];
    setBlackout: React.Dispatch<React.SetStateAction<Blackout>>;
}
export interface BlackoutImage {
    url: string;
    name?: string;
    options?: { id?: string; nick?: string; name?: string; url?: string };
    sender?: { id?: string; nick?: string; name?: string; url?: string };
}

export const BlackoutProvider = ({ children }: { children: ReactNode }) => {
    const [blackoutStack, setBlackoutStack] = useState<Blackout[]>([]);

    const blackout = blackoutStack[blackoutStack.length - 1] ?? { seted: false };

    const setBlackout: React.Dispatch<React.SetStateAction<Blackout>> = (action) => {
        setBlackoutStack((prev) => {
            const current = prev[prev.length - 1] ?? { seted: false };
            const next = typeof action === "function" ? action(current) : action;

            if (!next.seted) {
                return prev.length > 1 ? prev.slice(0, -1) : [];
            }

            if (!next.module) {
                return prev.length ? [...prev.slice(0, -1), next] : [next];
            }

            if (next.isRoot) {
                return [next];
            }

            if (current.seted && current.module === next.module) {
                return [...prev.slice(0, -1), next];
            }

            return [...prev, next];
        });
    };

    return (
        <BlackoutContext.Provider value={{ blackout, blackoutStack, setBlackout }}>
            {children}
        </BlackoutContext.Provider>
    );
};

export default BlackoutContext;