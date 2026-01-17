import ContactsList from "../ts/SM/ContactsList"
import "../../scss/modules/Redirecting.scss";
import { Search } from "lucide-react";
import { useChat } from "../hooks/ChatHook";
import { X } from "@phosphor-icons/react";

export default function Redirecting() {
    const { setSearch } = useChat()
    return (
        <div className="contactListModule">
            <div className="redirectBar">
                <div className="SMsearch">
                    <input type="text" className="SMsearchInput" onChange={(e) => setSearch(e.currentTarget.value)}/>
                    <Search />
                </div>
                <div className="cancelRedirect">
                    <div className="cancelRedirectButt">
                        <X/>
                    </div>
                </div>
            </div>
            <ContactsList/>
        </div>
    )
}