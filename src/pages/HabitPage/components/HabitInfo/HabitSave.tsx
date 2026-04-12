import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
interface HabitSaveType {
    readOnly:boolean,
    archived:boolean,
    id:number
}
export default function HabitSave ({readOnly, archived, id}:HabitSaveType) {
    const { saveHabit, localChanges, isUpdating } = useUpHabit()

    const hasUnsavedChanges = !!localChanges[id];
    const isThisUpdating = isUpdating.includes(`habit_${id}`);

    if (readOnly || archived) return

    return (
        <div className="habitSaveDiv">
            {hasUnsavedChanges && (
                <div className="habitSaveHint">
                    Не забудьте сохранить!
                </div>
            )}
            <div
                className={`habitSave ${isThisUpdating ? "saving" : ""}`}
                onClick={async () => {
                    if (readOnly || archived || !hasUnsavedChanges || isThisUpdating) return;
                    await saveHabit(id);
                }}
            >
                {isThisUpdating ? "Сохраняется..." : "Сохранить"}
            </div>
        </div>
    )
}