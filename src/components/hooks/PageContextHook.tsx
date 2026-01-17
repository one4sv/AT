import { useContext } from "react";
import PageTitleContext from "../context/PageTitleContext";
import type { PageTitleContextType } from "../context/PageTitleContext";

export const usePageTitle = (): PageTitleContextType => {
    const context = useContext(PageTitleContext);
    if (!context) {
        throw new Error("useNote must be used within an NoteProvider");
    }
    return context;
};
