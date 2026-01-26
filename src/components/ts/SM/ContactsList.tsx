import { useEffect, useState } from "react"
import "../../../scss/SM/contactsList.scss"
import { useChat } from "../../hooks/ChatHook"
import Contact from "../Contact"

export default function ContactsList({filter} : {filter: string}) {
    const { list } = useChat()
    const [ filtered, setFilterd ] = useState(list)

    useEffect(() => {
        if (filter === "all") setFilterd(list)
        else if (filter === "new") setFilterd(list.filter(c => c.unread_count > 0))
        else if (filter === "private") setFilterd(list.filter(c => !c.is_group))
        else if (filter === "group") setFilterd(list.filter(c => c.is_group))
    }, [filter, list])

    return (
        <div className="contactsList SMlist">
            {filtered ? (
                filtered.map((contact) => (
                    <Contact contact={contact} key={contact.id}/>
                ))
            ) : (
                <div className="contactsNothing">
                    Упс! Здесь никого нет.
                </div>
            )}
        </div>
    )
}