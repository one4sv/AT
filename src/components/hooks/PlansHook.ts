import { useContext } from "react";
import PlansContext from "../context/PlansContext";

export const usePlans = () => {
    const context = useContext(PlansContext);
    if (!context) throw new Error("usePlans must be used within PlansProvider");
    return context;
};
