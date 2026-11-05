import { useTranslation } from "react-i18next";
import { useState } from "react";
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useSchedule } from "../hooks/ScheduleHook";
import { useSettings } from "../hooks/SettingsHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import { isOddWeek } from "../../pages/HabitPage/utils/isOddWeek";
import "../../pages/HabitPage/scss/HabitChatMenu.scss";
import "../../pages/HabitPage/scss/HabitTaskEditor.scss";

type TaskDraft = { name: string; start_time: string; end_time: string };
const emptyTask = (): TaskDraft => ({ name: "", start_time: "", end_time: "" });

export default function HabitTaskEditor() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const { habit, loadHabit } = useTheHabit();
    const { chosenDay } = useCalendar();
    const { loadHabitSchedule, saveHabitSchedule, schedule_settings } = useSchedule();
    const { weekStart } = useSettings();
    const { showNotification } = useNote();
    const [tasks, setTasks] = useState<TaskDraft[]>([emptyTask()]);
    const [saving, setSaving] = useState(false);
    const scheduleMode = blackout.point === "schedule";
    const date = blackout.options?.id || chosenDay;
    const [year, month, day] = date.split("-");
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const canCreate = !!habit && (scheduleMode ? !!habit.access?.can_edit_blocks : !!habit.access?.can_complete);
    const filled = tasks.filter(task => task.name.trim());
    const editTask = (index: number, key: keyof TaskDraft, value: string) => {
        setTasks(current => current.map((task, i) => i === index ? { ...task, [key]: value } : task));
    };

    const save = async () => {
        if (!habit || !validDate || !canCreate || saving || !filled.length) return;
        setSaving(true);
        let savedCount = 0;
        try {
            if (scheduleMode) {
                const habitId = String(habit.id);
                const blocks = await loadHabitSchedule(habitId);
                const isSeparated = !!schedule_settings[habitId]?.isSeparated;
                const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
                const separator = isSeparated ? !isOddWeek(weekStart, new Date(`${date}T12:00:00`)) : false;
                const payload = [
                    ...blocks.map(block => ({
                        id: block.id, day_of_week: block.day_of_week,
                        isSeparator: block.isSeparator, name: block.name,
                        start_time: block.start_time || null,
                        end_time: block.end_time || null
                    })),
                    ...filled.map(task => ({
                        id: 0, day_of_week: dayOfWeek, isSeparator: separator,
                        name: task.name.trim(),
                        start_time: task.start_time || null,
                        end_time: task.end_time || null
                    }))
                ];
                const saved = await saveHabitSchedule(habitId, payload, isSeparated);
                if (!saved) throw new Error(t("habitDialog.scheduleFailed"));
                savedCount = filled.length;
            } else {
                for (const task of filled) {
                    await api.post("checklist/save", {
                        habit_id: habit.id, date, name: task.name.trim(),
                        start_time: task.start_time, end_time: task.end_time
                    });
                    savedCount++;
                }
                await loadHabit(String(habit.id));
            }
            window.dispatchEvent(new CustomEvent("habit-tasks-updated", { detail: { habitId: habit.id } }));
            setBlackout({ seted: false });
            showNotification("success", savedCount === 1 ? t("habitDialog.taskAdded") : t("habitDialog.tasksAdded", { count: savedCount }));
        } catch {
            if (savedCount) await loadHabit(String(habit.id));
            showNotification("error", savedCount
                ? t("habitDialog.tasksPartial", { count: savedCount, total: filled.length })
                : t("habitDialog.tasksFailed"));
        } finally {
            setSaving(false);
        }
    };

    return <div className="habitCollaborationModal habitTaskEditor" role="dialog" aria-modal="true" aria-label={t("habitDialog.addTasks")}>
        <div className="habitCollaborationHeader">
            <span>{t("habitDialog.tasksFor", { date: `${day}.${month}.${year}` })}</span>
            <button type="button" aria-label={t("habitDialog.close")} onClick={() => setBlackout({ seted: false })}><XIcon /></button>
        </div>
        <div className="habitTaskFields">
            {tasks.map((task, index) => <div className="habitTaskFieldsRow" key={index}>
                <div className="habitTaskNameRow">
                    <input
                        autoFocus={index === 0}
                        type="text"
                        maxLength={1000}
                        value={task.name}
                        placeholder={t("habitDialog.taskName")}
                        aria-label={t("habitDialog.taskNameIndex", { index: index + 1 })}
                        onChange={event => editTask(index, "name", event.target.value)}
                    />
                    {tasks.length > 1 && <button type="button" aria-label={t("habitDialog.removeTask")} onClick={() => setTasks(current => current.filter((_, i) => i !== index))}><TrashIcon /></button>}
                </div>
                <div className="habitTaskTimes">
                    <label>{t("habitDialog.from")} <input type="time" value={task.start_time} onChange={event => editTask(index, "start_time", event.target.value)} /></label>
                    <label>{t("habitDialog.to")} <input type="time" value={task.end_time} onChange={event => editTask(index, "end_time", event.target.value)} /></label>
                </div>
            </div>)}
            <button type="button" className="habitTaskAddAnother" onClick={() => setTasks(current => [...current, emptyTask()])}>
                <PlusIcon /> {t("habitDialog.addAnother")}
            </button>
        </div>
        <button type="button" className="habitCollaborationClose" disabled={!canCreate || !validDate || !filled.length || saving} onClick={() => void save()}>
            {saving ? t("habitDialog.saving") : filled.length > 1 ? t("habitDialog.addTasksCount", { count: filled.length }) : t("habitDialog.addTask")}
        </button>
    </div>;
}
