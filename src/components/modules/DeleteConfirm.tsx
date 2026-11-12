import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import { useHabits } from "../hooks/HabitsHook";
import { useNavigate} from "react-router";
import { useNote } from "../hooks/NoteHook";
import "./scss/deleteConfirm.scss";
import { useAcc } from "../hooks/AccHook";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import Toggler from "../ts/Toggler";
import { useMessages } from "../hooks/MessagesHook";
import { useGroup } from "../hooks/GroupHook";
import axios from "axios";
import { useContacts } from "../hooks/ContactsHook";
import { useChat } from "../hooks/ChatHook";

export default function DeleteConfirm() {
    const { t } = useTranslation("common");
    const { user } = useUser()
    const { refetchHabits } = useHabits();
    const { refetchContacts, refetchContactsWTLoading } = useContacts();
    const { deleteConfirm, deleteMess } = useDelete();
    const { setChosenMess } = useMessages()
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const { refetchAcc } = useAcc();
    const { group } = useGroup();
    const { setActiveHeader } = useChat()

    const navigate = useNavigate();

    const [ delThing, setDelThing] = useState("");
    const [ delForAll, setDelForAll ] = useState(false)
    const [ deleting, setDeleting ] = useState(false)
    
    useEffect(() => {
        if (deleteConfirm.goal === "post") setDelThing(t("deleteDialog.post"));
        else if (deleteConfirm.goal === "habit") setDelThing(t("deleteDialog.habit"));
        else if (deleteConfirm.goal === "chat") setDelThing(t("deleteDialog.chat"));
        else if (deleteConfirm.goal === "mess" && deleteMess && deleteMess.length > 0) setDelThing(String(deleteMess?.length));
        else if (deleteConfirm.goal === "mess" && deleteMess && deleteMess.length === 0) setDelThing(t("deleteDialog.this"));
        else if (deleteConfirm.goal === "member") setDelThing(`${deleteConfirm.name}`);
        else if (deleteConfirm.goal === "leave") setDelThing(`${deleteConfirm.name}`);
        else setDelThing(t("deleteDialog.item"));

    }, [deleteConfirm.goal, deleteConfirm.name, deleteMess, t]);

    const deleteThis = async () => {
        if (deleting) return;
        setDeleting(true);
        const { goal, id } = deleteConfirm;
        try {
            const res = await api.post(
                `delete`,
                { goal: goal === "mess" && delForAll ? "messForAll" : goal, delete_id: goal === "mess" && deleteMess?.length ? deleteMess : id, group_id: group?.id || id || null}
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
                    setActiveHeader("text")
                    setChosenMess([])
                } else if (goal === "member") {
                    refetchContactsWTLoading()
                } else if (goal === "leave") {
                    refetchContactsWTLoading()
                }
                setBlackout({ seted: false });
            } else {
                showNotification("error", res.data.message || t("deleteDialog.deleteFailed"));
            }
        } catch (error) {
            const serverMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || error.response?.data?.message
                : null;
            showNotification("error", serverMessage || t("deleteDialog.deleteFailed"));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="deleteDiv" role="dialog" aria-modal="true" aria-label={t("deleteDialog.confirmAction")}>
            <div className="deleteTitle">{t("deleteDialog.confirmAction")}</div>
            <div className="deleteSpan">
                {deleteConfirm.goal === "member"
                    ? t("deleteDialog.removeMember", { name: deleteConfirm.name, group: group?.name })
                    : deleteConfirm.goal === "leave"
                            ? t("deleteDialog.leave", { name: delThing })
                            : t("deleteDialog.delete", { type: delThing, name: deleteConfirm.name })
                }
            </div>
            {deleteConfirm.goal === "mess" && (
                <div className={`deleteMessForAll ${delForAll ? "on" : ""}`}>
                    <Toggler state={delForAll} setState={setDelForAll}/>
                    <span onClick={() => setDelForAll(prev => !prev)}>{t("deleteDialog.forAll")}</span>
                </div>
            )}
            <div className="deleteButts">
                <button
                    className="deleteCancel"
                    onClick={() => setBlackout({ seted: false })}
                >
                    {t("deleteDialog.cancel")}
                </button>
                <button className="deleteConfirm" onClick={deleteThis} disabled={deleting}>
                    {deleteConfirm.goal === "member" || deleteConfirm.goal === "leave" ? t("deleteDialog.confirm") : t("deleteDialog.remove")}
                </button>
            </div>
        </div>
    );
}
