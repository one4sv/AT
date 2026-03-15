import { useContext } from "react";
import SideMenuContext from "../context/SideMenuContext";

export const useSideMenu = () => {
    const context = useContext(SideMenuContext);
    if (!context) {
        throw new Error("useSideMenu must be used within SideMenuProvider");
    }
    return context;
};