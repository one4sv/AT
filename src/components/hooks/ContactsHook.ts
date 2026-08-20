import { useContext } from "react";
import ContactsContext from "../context/ContactsContext";
import type { ContactsContextType } from "../context/ContactsContext";

export const useContacts = (): ContactsContextType => {
    const context = useContext(ContactsContext);
    if (!context) {
        throw new Error("useContacts must be used within an ContactsProvider");
    }
    return context;
};
