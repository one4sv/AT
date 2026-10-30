import React, { createContext, useEffect, useState } from "react";
import { type ReactNode } from "react"
import { useLocation } from "react-router";
import { type Media } from "./ChatContext";
import { type message } from "./ChatContext";
const MessagesContext = createContext<MessagesContextType | null>(null);

export type ForwardPost = { id: number; text: string; author: string };

export interface MessagesContextType {
    forwardPost: ForwardPost | null,
    setForwardPost: (post: ForwardPost | null) => void,
    chosenMess: { id: number; text: string }[],
    setChosenMess: React.Dispatch<React.SetStateAction<{ id: number; text: string }[]>>,
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
    const [ chosenMess, setChosenMess ] = useState<{ id: number; text: string }[]>([])
    const [ pendingScrollId, setPendingScrollId ] = useState<number | null>(null)
    const [ answerState, setAnswerState ] = useState<{
        id: string
        sender: string
        text?: string
        previewText: string
        media?: Media[]
    } | null>(null)
    const [ editingState, setEditingState ] = useState<{
        id: string
        text?: string
        previewText: string
        media?: Media[]
    } | null>(null)
    const [ redirectState, setRedirectState ] = useState<message[] | undefined>(undefined)
    const [ forwardPost, setForwardPostState ] = useState<ForwardPost | null>(null);
    const [ showNames, setShowNames ] = useState(true)

    const location = useLocation()

    const setAnswer: MessagesContextType["setAnswer"] = (value) => {
        setAnswerState(value)
        setForwardPostState(null)
        setEditingState(null)
        setRedirectState(undefined)
        setShowNames(true)
    }

    const setEditing: MessagesContextType["setEditing"] = (value) => {
        setEditingState(value)
        setForwardPostState(null)
        setAnswerState(null)
        setRedirectState(undefined)
        setShowNames(true)
    }

    const setRedirect: MessagesContextType["setRedirect"] = (value) => {
        setRedirectState(value)
        setForwardPostState(null)
        setAnswerState(null)
        setEditingState(null)
    }

    const setForwardPost = (post: ForwardPost | null) => {
        setForwardPostState(post);
        if (post) {
            setAnswerState(null);
            setEditingState(null);
            setRedirectState(undefined);
        }
    };

    useEffect(() => {
        setAnswerState(null)
        setEditingState(null)
        if (!location.pathname.startsWith("/chat")) {
            setForwardPostState(null);
            setShowNames(true)
            setRedirectState(undefined)
        }
    }, [location.pathname])

    useEffect(() => {
        if (redirectState?.length === 0) {
            setShowNames(true)
            setRedirectState(undefined)
        }
    }, [redirectState?.length])

    return (
        <MessagesContext.Provider
            value={{
                forwardPost, setForwardPost,
                chosenMess, setChosenMess,
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