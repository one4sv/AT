import { useEffect, useState } from "react";
import { api } from "../../../../components/ts/api";

interface Member {
    user_id: string;
    status: "pending" | "accepted" | "declined";
    user: { nick: string; username: string; avatar_url?: string } | null;
}

export default function HabitMembers({ habitId, isOwner }: { habitId: number; isOwner: boolean }) {
    const [ members, setMembers ] = useState<Member[]>([]);
    const [ nick, setNick ] = useState("");
    const [ ownerId, setOwnerId ] = useState("");
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState("");
    const [ pending, setPending ] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`habits/${habitId}/members`);
            if (!res.data.success) throw new Error("Members unavailable");
            setMembers(res.data.members || []);
            setOwnerId(res.data.owner_id);
            setError("");
        } catch {
            setError("Не удалось загрузить участников");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId]);

    const invite = async () => {
        if (!nick.trim() || pending) return;
        setPending(true);
        try {
            const res = await api.post(`habits/${habitId}/members`, { nick: nick.trim() });
            if (!res.data.success) throw new Error("Invite failed");
            setNick("");
            await load();
        } catch {
            setError("Не удалось пригласить пользователя. Проверь ник или наличие приглашения.");
        } finally {
            setPending(false);
        }
    };

    const remove = async (userId: string) => {
        if (pending) return;
        setPending(true);
        try {
            const res = await api.delete(`habits/${habitId}/members/${userId}`);
            if (!res.data.success) throw new Error("Removal failed");
            await load();
        } catch {
            setError("Не удалось удалить участника");
        } finally {
            setPending(false);
        }
    };

    return (
        <section className="habitMembers">
            <h3>Участники активности</h3>
            {isOwner && <div className="habitMembersInvite">
                <input className="addHabitInput" value={nick} placeholder="Ник пользователя" onChange={event => setNick(event.target.value)} />
                <button type="button" disabled={pending || !nick.trim()} onClick={() => void invite()}>Пригласить</button>
            </div>}
            {loading && <span>Загрузка участников…</span>}
            {error && <p role="alert">{error}</p>}
            {members.map(member => <div className="habitMember" key={member.user_id}>
                <span>{member.user?.username || member.user?.nick || "Пользователь"} — {member.status === "accepted" ? "участник" : member.status === "pending" ? "приглашён" : "отказался"}</span>
                {isOwner && member.user_id !== ownerId && <button type="button" disabled={pending} onClick={() => void remove(member.user_id)}>Удалить</button>}
            </div>)}
        </section>
    );
}
