import { createContext, useState } from "react";
import { type ReactNode } from "react"
import ModuleMap from "../modules/ModuleMap";
const BlackoutContext = createContext<BlackoutContextType | null>(null);

export interface Blackout {
    seted:boolean;
    module?:keyof typeof ModuleMap;
    pick?:File;
    bg?:File;
    img?:string
}
export interface BlackoutContextType {
    blackout:Blackout
    setBlackout: React.Dispatch<React.SetStateAction<Blackout>>
}
export const BlackoutProvider = ({children} : {children : ReactNode}) => {
    const [ blackout, setBlackout ] = useState<Blackout>({ seted:false })
    return(
        <BlackoutContext.Provider value={{blackout, setBlackout}}>
            {children}
        </BlackoutContext.Provider>
    )
}

export default BlackoutContext;