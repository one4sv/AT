import { type RefObject } from "react"
import "../../../scss/SM/contactsList.scss"
import { useChat } from "../../hooks/ChatHook"
import Contact from "../Contact"
import { GhostIcon, MagnifyingGlassMinusIcon } from "@phosphor-icons/react"

export default function ContactsList({filter, searchRef} : {filter: string, searchRef:RefObject<HTMLInputElement | null>}) {
    const { list, search } = useChat()

    const filtered = list.filter(contact => {
        if (filter === "new") return contact.unread_count > 0
        if (filter === "private") return !contact.is_group
        if (filter === "group") return contact.is_group
        return true
    })
    console.log(list, search)
    return (
        <div className="contactsList SMlist">
            {filtered.length > 0 ? filtered.map((contact) => (
                <Contact contact={contact} key={contact.id}/>
            )) : search.length > 0 ? (
                <div className="habitsList SMlist nothing" onClick={() => searchRef.current?.focus()}>
                    <MagnifyingGlassMinusIcon size={50} strokeWidth={1.5}/>
                    Пользователи не найдены
                </div>
            ) : (
                <div className="habitsList SMlist nothing" onClick={() => searchRef.current?.focus()}>
                    <GhostIcon size={50} strokeWidth={1.5} />
                    Упс! А здесь никого нет!
                    <a>Найти собеседника</a>
                </div>
            )}
        </div>
    )
}