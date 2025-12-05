import { createContext, useState } from "react";
import { type ReactNode } from "react"
const DropContext = createContext<DropContextType | null>(null);

export interface DropContextType {
    isDragging:boolean,
    droppedFiles:File[],
    setDroppedFiles:React.Dispatch<React.SetStateAction<File[]>>
    handleDrop:(e: React.DragEvent<HTMLDivElement>) => void,
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void,
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void,
}
export const DropProvider = ({children} : {children : ReactNode}) => {
    const [ droppedFiles, setDroppedFiles ] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
        setIsDragging(false);
    }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            setDroppedFiles(prev => [...prev, ...droppedFiles]);
        }
        setIsDragging(false)
    };

    return(
        <DropContext.Provider value={{isDragging, droppedFiles, handleDrop, setDroppedFiles, handleDragEnter, handleDragOver, handleDragLeave }}>
            {children}
        </DropContext.Provider>
    )
}

export default DropContext;