import { createContext, useState } from "react";
import { type ReactNode } from "react"
const DeleteContext = createContext<DeleteContextType | null>(null);

export interface Delete {
    goal:string,
    id:number,
    name:string
}
export interface DeleteContextType {
    deleteConfirm:Delete,
    setDeleteConfirm:React.Dispatch<React.SetStateAction<Delete>>
}
export const DeleteProvider = ({children} : {children : ReactNode}) => {
    const [ deleteConfirm, setDeleteConfirm ] = useState<Delete>({ goal:"", id:0,name:"" })
    return(
        <DeleteContext.Provider value={{deleteConfirm, setDeleteConfirm}}>
            {children}
        </DeleteContext.Provider>
    )
}

export default DeleteContext;