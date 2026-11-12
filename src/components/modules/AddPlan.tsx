import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useNote } from "../hooks/NoteHook";
import { usePlans } from "../hooks/PlansHook";
import { api } from "../ts/api";
import PlanEditor, { type PlanInput } from "../../pages/Plan/PlanEditor";
import "./scss/addPlan.scss";

export default function AddPlan() {
    const { t } = useTranslation("common");
    const { chosenDay, setChosenDay } = useCalendar();
    const { refreshPlans, upsertPlan } = usePlans();
    const navigate = useNavigate();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [saving, setSaving] = useState(false);

    const create = async (input: PlanInput) => {
        if (saving) return;
        if (input.start_time && input.end_time && input.end_time < input.start_time) {
            showNotification("error", t("plans.invalidTime"));
            return;
        }
        setSaving(true);
        try {
            const res = await api.post("plans", input);
            if (!res.data.success) throw new Error("Plan was not created");
            upsertPlan({ ...res.data.plan, membership_status: "accepted", is_owner: true,
                completed_for_me: false });
            setChosenDay(input.plan_date);
            setBlackout({ seted: false });
            navigate("/habit");
            void refreshPlans().catch(() => {});
            showNotification("success", t("plans.added"));
        } catch {
            showNotification("error", t("plans.saveError"));
        } finally {
            setSaving(false);
        }
    };
    return <PlanEditor modal initialDate={chosenDay} saving={saving} onSave={create}
        onClose={() => setBlackout({ seted: false })}/>;
}
