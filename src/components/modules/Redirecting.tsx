import ContactsList from "../ts/SM/ContactsList"
import "../../scss/modules/Redirecting.scss";
import { Search } from "lucide-react";
import { useChat } from "../hooks/ChatHook";
import { X } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useRef } from "react";

export default function Redirecting() {
    const { setSearch } = useChat()
    const { setBlackout } = useBlackout()
    const { setRedirect } = useMessages()
    const searchRef = useRef<HTMLInputElement | null>(null)
    return (
        <div className="contactListModule">
            <div className="redirectBar">
                <div className="SMsearch">
                    <input type="text" className="SMsearchInput" ref={searchRef} onChange={(e) => setSearch(e.currentTarget.value)}/>
                    <Search />
                </div>
                <div className="cancelRedirect">
                    <div className="cancelRedirectButt" onClick={() => {
                        setBlackout({seted:false})
                        setRedirect(undefined)
                    }}>
                        <X/>
                    </div>
                </div>
            </div>
            <ContactsList filter="all" searchRef={searchRef}/>
        </div>
    )
}