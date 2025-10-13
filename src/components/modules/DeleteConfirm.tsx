import axios from "axios"
import { useBlackout } from "../hooks/BlackoutHook"
import { useDelete } from "../hooks/DeleteHook"
import { useHabits } from "../hooks/HabitsHook"
import { useChat } from "../hooks/ChatHook"
import { useNavigate } from "react-router"
import { useNote } from "../hooks/NoteHook"
import "../../scss/deleteConfirm.scss"

export default function DeleteConfirm () {
    const { refetchHabits } = useHabits()
    const { refetchContacts } = useChat()
    const { deleteConfirm } = useDelete()
    const { setBlackout } = useBlackout()
    const { showNotification } = useNote()
    const API_URL = import.meta.env.VITE_API_URL

    const navigate = useNavigate()

    const deleteThis = async() => {
        const {goal, id} = deleteConfirm
        try {
            const res = await axios.post(`${API_URL}delete`, { goal:goal, delete_id:id }, {withCredentials:true})
            if (res.data.success) {
                if (goal === "habit") {
                    refetchHabits()
                    navigate("/stats")
                    setBlackout({seted:false})
                } else {
                    refetchContacts()
                    navigate("/")
                }
            }
        } catch {
            showNotification("error", "Не удалось удалить")
        }
    }
    return (
        <div className="deleteDiv">
            <span className="deleteSpan">
                {`Вы действительно хотите удалить ${deleteConfirm.goal === "habit" ? "привычку" : "диалог с"} ${deleteConfirm.name}`}
            </span>
            <div className="deleteButts">
                <button className="deleteCancel" onClick={() => setBlackout({seted:false})}>
                    Отмена
                </button>
                <button className="deleteConfirm" onClick={deleteThis}>
                    Удалить
                </button>
            </div>
            
        </div>
    )
}