import { useContext } from "react";
import ContextMenuContext, { type ContextMenuContextType } from "../context/ContextMenuContext"; 

export const useContextMenu = (): ContextMenuContextType => {
    const context = useContext(ContextMenuContext);
    if (!context) {
        throw new Error("useContextMenu must be used inside <ContextMenuProvider>");
    }
    return context;
}
