import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import { useHabits } from "../hooks/HabitsHook";
import { useChat } from "../hooks/ChatHook";
import { useNavigate} from "react-router";
import { useNote } from "../hooks/NoteHook";
import "../../scss/modules/deleteConfirm.scss";
import { useAcc } from "../hooks/AccHook";
import { useState, useEffect } from "react";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import Toggler from "../ts/toggler";
import { useMessages } from "../hooks/MessagesHook";

export default function DeleteConfirm() {
    const { user } = useUser()
    const { refetchHabits } = useHabits();
    const { refetchContacts, refetchContactsWTLoading } = useChat();
    const { deleteConfirm, deleteMess } = useDelete();
    const { setChosenMess, setIsChose } = useMessages()
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const { refetchAcc } = useAcc();

    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL;
    const [ delThing, setDelThing] = useState("");
    const [ delForAll, setDelForAll ] = useState(false)
    
    useEffect(() => {
        if (deleteConfirm.goal === "post") setDelThing("пост");
        else if (deleteConfirm.goal === "habit") setDelThing("привычку");
        else if (deleteConfirm.goal === "chat") setDelThing("диалог с");
        else if (deleteConfirm.goal === "mess" && deleteMess && deleteMess.length >0) setDelThing(String(deleteMess?.length));
        else if (deleteConfirm.goal === "mess" && deleteMess && deleteMess.length === 0) setDelThing("это");
        else setDelThing("объект");

    }, [deleteConfirm.goal, deleteMess, deleteMess?.length]);

    const deleteThis = async () => {
        const { goal, id } = deleteConfirm;
        try {
            const res = await api.post(
                `${API_URL}delete`,
                { goal: goal === "mess" && delForAll ? "messForAll" : goal, delete_id: deleteMess && deleteMess.length > 0 ? deleteMess : id}
            );

            if (res.data.success && user.nick) {
                if (goal === "post") {
                    refetchAcc(user.nick);
                    navigate(`/acc/${user.nick}`);
                } else if (goal === "habit") {
                    refetchHabits();
                    navigate("/habit");
                } else if (goal === "chat") {
                    refetchContacts();
                    navigate("/");
                } else if (goal === "mess") {
                    refetchContactsWTLoading()
                    setIsChose(false)
                    setChosenMess([])
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
            {deleteConfirm.goal === "mess" && (
                <div className={`deleteMessForAll ${delForAll ? "on" : ""}`}>
                    <Toggler state={delForAll} setState={setDelForAll}/>
                    <span onClick={() => setDelForAll(prev => !prev)}>Удалить эти сообщения для всех</span>
                </div>
            )}
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
