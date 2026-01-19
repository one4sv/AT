import { useContext } from "react";
import SendMessContext from "../context/SendMessContext.tsx";
import type { SendMessContextType } from "../context/SendMessContext.tsx";

export const useSendMess = (): SendMessContextType => {
    const context = useContext(SendMessContext);
    if (!context) {
        throw new Error("useSendMess must be used within an SendMessProvider");
    }
    return context;
};
