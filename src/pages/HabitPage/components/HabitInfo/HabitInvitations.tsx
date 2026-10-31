import { useEffect, useState } from "react";
import { api } from "../../../../components/ts/api";
import { Link } from "react-router-dom";
import { useHabits } from "../../../../components/hooks/HabitsHook";

interface Invitation {
    habit_id: number;
    status: "pending" | "accepted";
    habit: { id: number; name: string } | null;
}

export default function HabitInvitations() {
    const { refetchHabits } = useHabits();
    const [ invitations, setInvitations ] = useState<Invitation[]>([]);
    const [ busy, setBusy ] = useState<number | null>(null);
    const [ error, setError ] = useState("");

    useEffect(() => {
        let active = true;
        api.get("habits/invitations").then(res => {
            if (active && res.data.success) setInvitations(res.data.invitations || []);
        }).catch(() => {
            if (active) setError("Не удалось загрузить приглашения");
        });
        return () => { active = false; };
    }, []);

    const respond = async (id: number, status: "accepted" | "declined") => {
        setBusy(id);
        setError("");
        try {
            const res = await api.patch(`habits/${id}/members/me`, { status });
            if (!res.data.success) throw new Error("Invitation update failed");
            await refetchHabits();
            setInvitations(previous => status === "accepted"
                ? previous.map(item => item.habit_id === id ? { ...item, status } : item)
                : previous.filter(item => item.habit_id !== id));
        } catch {
            setError("Не удалось обработать приглашение");
        } finally {
            setBusy(null);
        }
    };

    if (!invitations.length && !error) return null;
    return (
        <section className="habitInvitations">
            <h3>Совместные активности</h3>
            {error && <p role="alert">{error}</p>}
            {invitations.map(item => <div key={item.habit_id} className="habitInvitation">
                {item.status === "accepted" ? <Link to={`/habit/${item.habit_id}`}>{item.habit?.name || "Активность"}</Link> : <>
                    <span>{item.habit?.name || "Активность"}</span>
                    <button type="button" disabled={busy !== null} onClick={() => void respond(item.habit_id, "accepted")}>Принять</button>
                    <button type="button" disabled={busy !== null} onClick={() => void respond(item.habit_id, "declined")}>Отклонить</button>
                </>}
            </div>)}
        </section>
    );
}
