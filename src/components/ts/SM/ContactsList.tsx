import "../../../scss/SM/contactsList.scss"
import { useChat } from "../../hooks/ChatHook"
import Contact from "../Contact"

export default function ContactsList({filter} : {filter: string}) {
    const { list } = useChat()

    return (
        <div className="contactsList SMlist">
            {list ? (
                list.map((contact) => (
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