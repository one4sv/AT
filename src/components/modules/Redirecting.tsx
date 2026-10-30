import ContactsList from "../ts/SM/ContactsList"
import "../../scss/modules/Redirecting.scss";
import { Search } from "lucide-react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useRef } from "react";
import { useContacts } from "../hooks/ContactsHook";

export default function Redirecting() {
    const { setSearch } = useContacts()
    const { setBlackout } = useBlackout()
    const { setRedirect, setForwardPost } = useMessages()
    const searchRef = useRef<HTMLInputElement | null>(null)
    return (
        <div className="contactListModule">
            <div className="redirectBar">
                <div className="SMsearch">
                    <input type="text" className="SMsearchInput" ref={searchRef} onChange={(e) => setSearch(e.currentTarget.value)}/>
                    <Search />
                </div>
            </div>
            <ContactsList filter="all" searchRef={searchRef}/>
            <div className="cancelRedirect">
                <div className="addHabitGoal" onClick={() => {
                    setBlackout({seted:false})
                    setRedirect(undefined)
                    setForwardPost(null)
                }}>
                    Отмена
                </div>
            </div>
        </div>
    )
}