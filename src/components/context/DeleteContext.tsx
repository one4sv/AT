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
}

export const DeleteProvider = ({children} : {children : ReactNode}) => {
    const [ deleteConfirm, setDeleteConfirm ] = useState<Delete>({ goal:"", id:"", name:"" })
    const [ deleteMess, setDeleteMess ] = useState<number[] | undefined>([])

    return(
        <DeleteContext.Provider value={{
            deleteConfirm, setDeleteConfirm, 
            deleteMess, setDeleteMess, 
        }}>
            {children}
        </DeleteContext.Provider>
    )
}

export default DeleteContext;