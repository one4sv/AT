import { createContext, useEffect, useState } from "react";
import { type ReactNode } from "react"
import { getDroppedFiles, hasFileDrop, materializeDroppedFiles } from "../ts/utils/fileDrop";
import { useNote } from "../hooks/NoteHook";
import { useTranslation } from "react-i18next";
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
    const { showNotification } = useNote();
    const { t } = useTranslation("common");
    const [ droppedFiles, setDroppedFiles ] = useState<File[]>([])
    const [ isDragging, setIsDragging ] = useState(false);

    useEffect(() => {
        // The composer may consume the drop itself and stop propagation.
        const reset = () => setIsDragging(false);
        document.addEventListener("drop", reset, true);
        document.addEventListener("dragend", reset, true);
        return () => {
            document.removeEventListener("drop", reset, true);
            document.removeEventListener("dragend", reset, true);
        };
    }, []);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!hasFileDrop(e.dataTransfer)) return;
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        if (!hasFileDrop(e.dataTransfer)) return;
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
        const droppedFiles = getDroppedFiles(e.dataTransfer);
        if (!droppedFiles.length && !hasFileDrop(e.dataTransfer)) return;
        e.preventDefault();
        e.stopPropagation();
        if (droppedFiles.length > 0) {
            const path = window.location.pathname;
            void materializeDroppedFiles(droppedFiles).then(files => {
                if (window.location.pathname === path) setDroppedFiles(prev => [...prev, ...files]);
            }).catch(error => showNotification("error", t(error?.message === "CHAT_FILE_LIMIT" ? "chatUi.fileLimit" : "chatUi.dropReadFailed")));
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