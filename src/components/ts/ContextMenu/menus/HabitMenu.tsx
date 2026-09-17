import { CheckCircle, Circle, PushPin, PushPinSlash } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useDone } from "../../../hooks/DoneHook";
import { useUpHabit } from "../../../hooks/UpdateHabitHook";
import DeleteButton from "../buttons/DeleteButton";
import LinkButton from "../buttons/LinkButton";

export default function HabitMenu() {
    const { menu } = useContextMenu();
    const { markDone } = useDone();
    const { setPin } = useUpHabit();

    const { habit, options } = menu;

    if (!habit) return null;

    const dateStr = `${new Date().getFullYear()}-${String(
        new Date().getMonth() + 1
    ).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

    return (
        <>
            {options?.isMy && habit.done !== undefined && (
                <div
                    className="ContextMenuButt"
                    onClick={() => markDone(habit.id, dateStr)}
                >
                    {habit.done ? <CheckCircle weight="fill" /> : <Circle />}
                    {habit.done ? "Выполнено" : "Выполнить"}
                </div>
            )}

            <LinkButton />

            {options?.isMy && (
                <div
                    className="ContextMenuButt"
                    onClick={() => setPin(habit.id, !habit.pinned)}
                >
                    {habit.pinned ? <PushPinSlash /> : <PushPin />}
                    {habit.pinned ? "Открепить" : "Закрепить"}
                </div>
            )}

            <DeleteButton />
        </>
    );
}