import { createContext, useState } from "react";
import { type ReactNode } from "react"
const MessagesContext = createContext<MessagesContextType | null>(null);

export interface MessagesContextType {
    chosenMess: { id: number; text: string }[],
    setChosenMess: React.Dispatch<React.SetStateAction<{ id: number; text: string }[]>>,
    isChose: boolean,
    setIsChose: React.Dispatch<React.SetStateAction<boolean>>,
    pendingScrollId: number | null,
    setPendingScrollId: React.Dispatch<React.SetStateAction<number | null>>
}

export const MessagesProvider = ({children} : {children : ReactNode}) => {
    const [ chosenMess, setChosenMess ] = useState<{ id:number; text:string }[]>([])
    const [ isChose, setIsChose ] = useState(false)
    const [ pendingScrollId, setPendingScrollId ] = useState<number | null>(null)

    return(
        <MessagesContext.Provider value={{
            chosenMess, setChosenMess,
            isChose, setIsChose,
            pendingScrollId,
            setPendingScrollId
        }}>
            {children}
        </MessagesContext.Provider>
    )
}

export default MessagesContext;