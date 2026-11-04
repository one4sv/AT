import ContactsList from "../ts/SM/ContactsList"
import "../../scss/modules/Redirecting.scss";
import { Search } from "lucide-react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useRef, useState } from "react";
import { useContacts } from "../hooks/ContactsHook";
import { useTranslation } from "react-i18next";

export default function Redirecting() {
    const { setSearch } = useContacts()
    const { setBlackout } = useBlackout()
    const { setRedirect, setForwardPost } = useMessages()
    const { t } = useTranslation("settings")
    const searchRef = useRef<HTMLInputElement | null>(null)
    const [ filter, setFilter ] = useState<"all" | "private" | "group" | "new">("all")
    const filters = [
        { value: "all" as const, label: t("quickFilters.all") },
        { value: "private" as const, label: t("quickFilters.private") },
        { value: "group" as const, label: t("quickFilters.group") },
        { value: "new" as const, label: t("forwardFilters.unread") }
    ]

    return (
        <div className="contactListModule">
            <div className="redirectBar">
                <div className="SMsearch">
                    <input type="text" className="SMsearchInput" ref={searchRef}
                        placeholder={t("quickFilters.search")}
                        onChange={(e) => setSearch(e.currentTarget.value)}/>
                    <Search />
                </div>
            </div>
            <div className="redirectFilters">
                {filters.map(item => (
                    <button type="button" key={item.value}
                        className={`redirectFilter ${filter === item.value ? "active" : ""}`}
                        onClick={() => setFilter(item.value)}
                    >{item.label}</button>
                ))}
            </div>
            <ContactsList filter={filter} searchRef={searchRef}/>
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
