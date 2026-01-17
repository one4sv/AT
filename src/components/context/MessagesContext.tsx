import React, { createContext, useEffect, useState } from "react";
import { type ReactNode } from "react"
import { useLocation } from "react-router";
import { type Media } from "./ChatContext";
import { type message } from "./ChatContext";
const MessagesContext = createContext<MessagesContextType | null>(null);

export interface MessagesContextType {
    chosenMess: { id: number; text: string }[],
    setChosenMess: React.Dispatch<React.SetStateAction<{ id: number; text: string }[]>>,
    isChose: boolean,
    setIsChose: React.Dispatch<React.SetStateAction<boolean>>,
    showNames: boolean,
    setShowNames: React.Dispatch<React.SetStateAction<boolean>>,
    pendingScrollId: number | null,
    setPendingScrollId: React.Dispatch<React.SetStateAction<number | null>>,
    answer: {id:string, sender:string, text?:string, previewText:string, media?:Media[]} | null,
    setAnswer:React.Dispatch<React.SetStateAction<{id:string, sender:string, text?:string, previewText:string} | null>>,
    editing: {id:string, text?:string, previewText:string, media?:Media[]} | null,
    setEditing:React.Dispatch<React.SetStateAction<{id:string, text?:string, previewText:string, media?:Media[]} | null>>,
    redirect:message[] | undefined,
    setRedirect: React.Dispatch<React.SetStateAction<message[] | undefined>>,

}

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
    const [chosenMess, setChosenMess] = useState<{ id: number; text: string }[]>([])
    const [isChose, setIsChose] = useState(false)
    const [pendingScrollId, setPendingScrollId] = useState<number | null>(null)
    const [answerState, setAnswerState] = useState<{
        id: string
        sender: string
        text?: string
        previewText: string
        media?: Media[]
    } | null>(null)
    const [editingState, setEditingState] = useState<{
        id: string
        text?: string
        previewText: string
        media?: Media[]
    } | null>(null)
    const [redirectState, setRedirectState] = useState<message[] | undefined>(undefined)
    const [ showNames, setShowNames ] = useState(true)

    const location = useLocation()

    const setAnswer: MessagesContextType["setAnswer"] = (value) => {
        setAnswerState(value)
        setEditingState(null)
        setRedirectState(undefined)
        setShowNames(true)
    }

    const setEditing: MessagesContextType["setEditing"] = (value) => {
        setEditingState(value)
        setAnswerState(null)
        setRedirectState(undefined)
        setShowNames(true)
    }

    const setRedirect: MessagesContextType["setRedirect"] = (value) => {
        setRedirectState(value)
        setAnswerState(null)
        setEditingState(null)
    }

    useEffect(() => {
        setAnswerState(null)
        setEditingState(null)
        if (!location.pathname.startsWith("/chat") || redirectState?.length === 0) {
            setShowNames(true)
            setRedirectState(undefined)
        }
    }, [location.pathname, redirectState?.length])

    return (
        <MessagesContext.Provider
            value={{
                chosenMess, setChosenMess,
                isChose, setIsChose,
                pendingScrollId, setPendingScrollId,
                answer: answerState, setAnswer,
                editing: editingState, setEditing,
                redirect:redirectState, setRedirect,
                showNames, setShowNames
            }}
        >
            {children}
        </MessagesContext.Provider>
    )
}


export default MessagesContext;