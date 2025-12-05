import { createContext, useState } from "react";
import { type ReactNode } from "react"
const DeleteContext = createContext<DeleteContextType | null>(null);

export interface Delete {
    goal:string,
    id:string | number,
    name:string
}
export interface DeleteContextType {
    deleteConfirm: Delete,
    setDeleteConfirm: React.Dispatch<React.SetStateAction<Delete>>,
    deleteMess: number[] | undefined,
    setDeleteMess: React.Dispatch<React.SetStateAction<number[] | undefined>>,
    chosenMess: { id: number; text: string }[],
    setChosenMess: React.Dispatch<React.SetStateAction<{ id: number; text: string }[]>>,
    isChose: boolean,
    setIsChose: React.Dispatch<React.SetStateAction<boolean>>,
}

export const DeleteProvider = ({children} : {children : ReactNode}) => {
    const [ deleteConfirm, setDeleteConfirm ] = useState<Delete>({ goal:"", id:"", name:"" })
    const [ deleteMess, setDeleteMess ] = useState<number[] | undefined>([])
    const [ chosenMess, setChosenMess ] = useState<{ id:number; text:string }[]>([])
    const [ isChose, setIsChose ] = useState(false)

    return(
        <DeleteContext.Provider value={{
            deleteConfirm, setDeleteConfirm, 
            deleteMess, setDeleteMess, 
            chosenMess, setChosenMess,
            isChose, setIsChose
        }}>
            {children}
        </DeleteContext.Provider>
    )
}

export default DeleteContext;