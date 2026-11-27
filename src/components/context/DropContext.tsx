import { createContext, useState } from "react";
import { type ReactNode } from "react"
const DropContext = createContext<DropContextType | null>(null);

export function hasFileDrag(data: DataTransfer) {
    return Array.from(data.types).includes("Files") ||
        Array.from(data.items ?? []).some(item => item.kind === "file");
}

export function getDraggedFiles(data: DataTransfer): File[] {
    const files = Array.from(data.files ?? []);
    if (files.length) return files;
    return Array.from(data.items ?? []).flatMap(item => {
        const file = item.kind === "file" ? item.getAsFile() : null;
        return file ? [file] : [];
    });
}

export interface DropContextType {
    isDragging:boolean,
    clearDrag: () => void,
    chatDroppedFiles: Record<string, File[]>,
    setChatDroppedFiles: React.Dispatch<React.SetStateAction<Record<string, File[]>>>,
    droppedFiles:File[],
    setDroppedFiles:React.Dispatch<React.SetStateAction<File[]>>
    handleDrop:(e: React.DragEvent<HTMLDivElement>) => void,
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
    handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void,
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void,
}
export const DropProvider = ({children} : {children : ReactNode}) => {
    const [ droppedFiles, setDroppedFiles ] = useState<File[]>([])
    const [ isDragging, setIsDragging ] = useState(false);
    const [chatDroppedFiles, setChatDroppedFiles] = useState<Record<string, File[]>>({});
    const clearDrag = () => setIsDragging(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!hasFileDrag(e.dataTransfer)) return;
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        if (!hasFileDrag(e.dataTransfer)) return;
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
        const droppedFiles = getDraggedFiles(e.dataTransfer);
        if (droppedFiles.length > 0) {
            setDroppedFiles(prev => [...prev, ...droppedFiles]);
        }
        setIsDragging(false)
    };

    return(
        <DropContext.Provider value={{isDragging, clearDrag, chatDroppedFiles, setChatDroppedFiles, droppedFiles, handleDrop, setDroppedFiles, handleDragEnter, handleDragOver, handleDragLeave }}>
            {children}
        </DropContext.Provider>
    )
}

export default DropContext;