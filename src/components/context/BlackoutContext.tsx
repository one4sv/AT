import { createContext, useState } from "react";
import { type ReactNode } from "react"
const BlackoutContext = createContext<BlackoutContextType | null>(null);

export interface Blackout {
    seted:boolean;
    module?:string;
    pick?:File;
    bg?:File;
    img?:string,
    point?:string,
    options?:{id?:string, nick?:string, name:string, url:string}
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