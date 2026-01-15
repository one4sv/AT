import React, { createContext, useEffect, useState } from "react";
import { type ReactNode } from "react"
import { useLocation } from "react-router";
import { type Media } from "./ChatContext";
const MessagesContext = createContext<MessagesContextType | null>(null);

export interface MessagesContextType {
    chosenMess: { id: number; text: string }[],
    setChosenMess: React.Dispatch<React.SetStateAction<{ id: number; text: string }[]>>,
    isChose: boolean,
    setIsChose: React.Dispatch<React.SetStateAction<boolean>>,
    pendingScrollId: number | null,
    setPendingScrollId: React.Dispatch<React.SetStateAction<number | null>>,
    answer: {id:string, sender:string, text?:string, previewText:string, media?:Media[]} | null,
    setAnswer:React.Dispatch<React.SetStateAction<{id:string, sender:string, text?:string, previewText:string} | null>>,
    redacting: {id:string, text?:string, previewText:string, media?:Media[]} | null,
    setRedacting:React.Dispatch<React.SetStateAction<{id:string, text?:string, previewText:string, media?:Media[]} | null>>,
}

export const MessagesProvider = ({children} : {children : ReactNode}) => {
    const [ chosenMess, setChosenMess ] = useState<{ id:number; text:string }[]>([])
    const [ isChose, setIsChose ] = useState(false)
    const [ pendingScrollId, setPendingScrollId ] = useState<number | null>(null)
    const [ answer, setAnswer ] = useState<{id:string, sender:string, text?:string, previewText:string } | null>(null)
    const [ redacting, setRedacting  ] = useState<{id:string, text?:string, previewText:string, media?:Media[]} | null>(null)
    const location = useLocation()

    useEffect(() => {
        if (location.pathname) {
            setAnswer(null)
            setRedacting(null)
        }
    }, [location])

    return(
        <MessagesContext.Provider value={{
            chosenMess, setChosenMess,
            isChose, setIsChose,
            pendingScrollId,
            setPendingScrollId,
            answer, setAnswer,
            redacting, setRedacting,
        }}>
            {children}
        </MessagesContext.Provider>
    )
}

export default MessagesContext;