import { type RefObject } from "react"
import "../../../scss/SM/contactsList.scss"
import Contact from "../Contact"
import { CaretRightIcon, GhostIcon, MagnifyingGlassMinusIcon, UsersIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useContacts } from "../../hooks/ContactsHook"
import { useNavigate } from "react-router"

export default function ContactsList({filter, searchRef} : {filter: string, searchRef: RefObject<HTMLInputElement | null>}) {
    const { t } = useTranslation("common")
    const { list, search, refetchContacts } = useContacts()
    const navigate = useNavigate()
    const filtered = list.filter(contact => {
        if (filter === "new") return contact.unread_count > 0
        if (filter === "private") return !contact.is_group
        if (filter === "group") return contact.is_group
        return true
    })

    return (
        <div className="contactsList SMlist">
            <div className={`SMmainButt ${location.pathname === "/" ? "active" : ""}`} onClick={() => navigate("/")}>
                <span className="SMmainButtName">
                    <UsersIcon size={30} weight="fill"/> Лента <CaretRightIcon/>
                </span>
                <div className="SMmainButtDesc">Просматривайте посты из спотов и от друзей, рекомендации, ближайшие активности и планы друзей</div>
            </div>
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