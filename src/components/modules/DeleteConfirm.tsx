import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import { useHabits } from "../hooks/HabitsHook";
import { useChat } from "../hooks/ChatHook";
import { useNavigate} from "react-router";
import { useNote } from "../hooks/NoteHook";
import "../../scss/deleteConfirm.scss";
import { useAcc } from "../hooks/AccHook";
import { useState, useEffect } from "react";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";

export default function DeleteConfirm() {
    const { user } = useUser()
    const { refetchHabits } = useHabits();
    const { refetchContacts } = useChat();
    const { deleteConfirm } = useDelete();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const { refetchAcc } = useAcc();
    const API_URL = import.meta.env.VITE_API_URL;
    const [delThing, setDelThing] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (deleteConfirm.goal === "post") setDelThing("пост");
        else if (deleteConfirm.goal === "habit") setDelThing("привычку");
        else if (deleteConfirm.goal === "chat") setDelThing("диалог с");
        else setDelThing("объект");
    }, [deleteConfirm.goal]);

    const deleteThis = async () => {
        const { goal, id } = deleteConfirm;
        try {
            const res = await api.post(
                `${API_URL}delete`,
                { goal: goal, delete_id: id }
            );

            if (res.data.success) {
                if (goal === "post") {
                    refetchAcc(user.id!);
                    navigate(`/acc/${user.id}`);
                } else if (goal === "habit") {
                    refetchHabits();
                    navigate("/habit");
                } else if (goal === "chat") {
                    refetchContacts();
                    navigate("/");
                }
                setBlackout({ seted: false });
            }
        } catch {
            showNotification("error", "Не удалось удалить");
        }
    };

    return (
        <div className="deleteDiv">
            <span className="deleteSpan">
                {`Вы действительно хотите удалить ${delThing} ${deleteConfirm.name}?`}
            </span>
            <div className="deleteButts">
                <button
                    className="deleteCancel"
                    onClick={() => setBlackout({ seted: false })}
                >
                    Отмена
                </button>
                <button className="deleteConfirm" onClick={deleteThis}>
                    Удалить
                </button>
            </div>
        </div>
    );
}
