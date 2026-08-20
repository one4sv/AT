import { type RefObject } from "react"
import "../../../scss/SM/contactsList.scss"
import Contact from "../Contact"
import { GhostIcon, MagnifyingGlassMinusIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useContacts } from "../../hooks/ContactsHook"

export default function ContactsList({filter, searchRef} : {filter: string, searchRef: RefObject<HTMLInputElement | null>}) {
    const { t } = useTranslation("common")
    const { list, search, refetchContacts } = useContacts()

    const filtered = list.filter(contact => {
        if (filter === "new") return contact.unread_count > 0
        if (filter === "private") return !contact.is_group
        if (filter === "group") return contact.is_group
        return true
    })

    return (
        <div className="contactsList SMlist">
            {filtered.length > 0 ? filtered.map((contact) => (
                <Contact contact={contact} key={contact.id}/>
            )) : search.length > 0 ? (
                <div className="habitsList SMlist nothing" onClick={() => searchRef.current?.focus()}>
                    <MagnifyingGlassMinusIcon size={50} strokeWidth={1.5}/>
                    {t("contactsList.usersNotFound")}
                </div>
            ) : (
                <div className="habitsList SMlist nothing" >
                    <div className="hbListNothingAction" onClick={() => searchRef.current?.focus()}>
                        <GhostIcon size={50} strokeWidth={1.5} />
                        {t("contactsList.noOneHere")}
                        <a>{t("contactsList.findInterlocutor")}</a>
                    </div>
                    <div className="wtbgButt" onClick={() => refetchContacts()}>
                        Обновить
                    </div>
                </div>
            )}
        </div>
    )
}