import "../../../scss/SM/contactsList.scss"
import { useChat } from "../../hooks/ChatHook"
import Contact from "../Contact"

export default function ContactsList() {
    const { list } = useChat()

    return (
        <div className="contactsList SMlist">
            {list ? (
                list.map((acc) => (
                    <Contact acc={acc} key={acc.id}/>
                ))
            ) : (
                <div className="contactsNothing">
                    Упс! Здесь никого нет.
                </div>
            )}
        </div>
    )
}