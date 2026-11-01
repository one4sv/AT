import { useRef, useState } from "react";
import axios from "axios";
import CreateChatInfo from "./components/CreateChatInfo";
import { useBlackout } from "../hooks/BlackoutHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import "../../scss/modules/CreateChat.scss";
import "../../pages/HabitPage/scss/HabitChatMenu.scss";

export default function HabitCreateChat() {
    const { habit, loadHabit } = useTheHabit();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [pick, setPick] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const submitting = useRef(false);

    const save = async () => {
        if (!habit || !name.trim() || name.trim().length < 3 || submitting.current) return;
        submitting.current = true;
        setSaving(true);
        try {
            const form = new FormData();
            form.append("habit_id", String(habit.id));
            form.append("members", "[]");
            form.append("name", name.trim());
            form.append("desc", desc.trim());
            if (pick) form.append("pick", pick);
            const result = await api.post("createchat", form);
            if (!result.data.success || !result.data.chat_id) throw new Error("Не удалось создать беседу");
            await loadHabit(String(habit.id));
            window.dispatchEvent(new Event("habit-members-updated"));
            setBlackout({ seted: false });
            setBlackout({ seted: false });
            showNotification("success", result.data.invited
                ? "Беседа создана. Второму участнику отправлено приглашение."
                : "Беседа создана и привязана к активности");
        } catch (error) {
            showNotification("error", axios.isAxiosError(error)
                ? error.response?.data?.error || "Не удалось создать беседу"
                : "Не удалось создать беседу");
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };

    return <div className="habitCollaborationModal habitCreateChat" role="dialog" aria-modal="true" aria-label="Создать беседу">
        <div className="habitCollaborationHeader">Создать беседу</div>
        <div className="habitCollaborationBody">
            <CreateChatInfo name={name} setName={setName} desc={desc} setDesc={setDesc} pick={pick} setPick={setPick} />
            <div className="habitSettingValue">Участников можно пригласить из созданной беседы. Если в активности уже есть второй участник, ему будет отправлено приглашение автоматически.</div>
        </div>
        <div className="habitConfirmActions">
            <button type="button" className="accept" disabled={saving || name.trim().length < 3} onClick={() => void save()}>
                {saving ? "Создаётся…" : "Создать"}
            </button>
        </div>
    </div>;
}
