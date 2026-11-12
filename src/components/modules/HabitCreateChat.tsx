import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import axios from "axios";
import CreateChatInfo from "./components/CreateChatInfo";
import { useBlackout } from "../hooks/BlackoutHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { usePlans } from "../hooks/PlansHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import "../../scss/modules/CreateChat.scss";
import "../../pages/HabitPage/scss/HabitChatMenu.scss";

export default function HabitCreateChat() {
    const { t } = useTranslation("common");
    const { habit, loadHabit } = useTheHabit();
    const { refreshPlans } = usePlans();
    const { blackout, setBlackout } = useBlackout();
    const planId = blackout.point === "plan" ? Number(blackout.options?.id) : null;
    const planMode = planId !== null && Number.isSafeInteger(planId) && planId > 0;
    const { showNotification } = useNote();
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [pick, setPick] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const submitting = useRef(false);

    const save = async () => {
        if ((!planMode && !habit) || !name.trim() || name.trim().length < 3 || submitting.current) return;
        submitting.current = true;
        setSaving(true);
        try {
            const form = new FormData();
            if (planMode) form.append("plan_id", String(planId));
            else if (habit) form.append("habit_id", String(habit.id));
            form.append("members", "[]");
            form.append("name", name.trim());
            form.append("desc", desc.trim());
            if (pick) form.append("pick", pick);
            const result = await api.post("createchat", form);
            if (!result.data.success || !result.data.chat_id) throw new Error(t("habitDialog.createFailed"));
            if (planMode) {
                await refreshPlans();
                window.dispatchEvent(new Event("plan-members-updated"));
            } else if (habit) {
                await loadHabit(String(habit.id));
                window.dispatchEvent(new Event("habit-members-updated"));
            }
            setBlackout({ seted: false });
            showNotification("success", result.data.invited
                ? t("habitDialog.createdWithInvite")
                : t("habitDialog.createdLinked"));
        } catch (error) {
            showNotification("error", axios.isAxiosError(error)
                ? error.response?.data?.error || t("habitDialog.createFailed")
                : t("habitDialog.createFailed"));
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };

    return <div className="habitCollaborationModal habitCreateChat" role="dialog" aria-modal="true" aria-label={t("habitDialog.createChat")}>
        <div className="habitCollaborationHeader">{t("habitDialog.createChat")}</div>
        <div className="habitCollaborationBody">
            <CreateChatInfo name={name} setName={setName} desc={desc} setDesc={setDesc} pick={pick} setPick={setPick} />
            <div className="habitSettingValue">{t("habitDialog.createChatHint")}</div>
        </div>
        <div className="habitConfirmActions">
            <button type="button" className="accept" disabled={saving || name.trim().length < 3} onClick={() => void save()}>
                {saving ? t("habitDialog.creating") : t("habitDialog.create")}
            </button>
        </div>
    </div>;
}
