import { UserCircleIcon, XIcon, UsersIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useUser } from "../../../../components/hooks/UserHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { api } from "../../../../components/ts/api";
import type { HabitMembersData, HabitUser } from "./useHabitMembers";

export default function HabitMembers({ habitId, data, loading, error }: { habitId: number; data: HabitMembersData | null; loading: boolean; error: string }) {
    const { user } = useUser();
    const { setBlackout } = useBlackout();
    const remove = (id: string, name: string, pending: boolean) => setBlackout({
        seted: true,
        module: "ConfirmAction",
        confirmAction: {
            title: pending ? "Отменить приглашение?" : "Удалить участника?",
            description: `${name} ${pending ? "не сможет принять это приглашение." : "потеряет доступ к совместной активности."}`,
            label: pending ? "Отменить приглашение" : "Удалить",
            run: async () => {
                await api.delete(`habits/${habitId}/members/${id}`);
                window.dispatchEvent(new Event("habit-members-updated"));
            }
        }
    });
    const row = (person: HabitUser | null, id: string, status: string, removable = false, pending = false) => <div className={`contactsUser habitMember ${user.id === id ? "active" : ""}`} key={id}>
        <div className="contactsUserPic">{person?.avatar_url ? <img className="contactsUserAvatar" src={person.avatar_url} alt="" /> : <UserCircleIcon />}</div>
        <div className="contactsUserInfo">
            <div className="contactsUserStr"><Link className="nameSpan" to={`/acc/${person?.nick || id}`}>{person?.username || person?.nick || "Пользователь"}</Link></div>
            <span className="habitMemberStatus">{status}</span>
        </div>
        {removable && <button type="button" className="habitMemberRemove" aria-label={pending ? "Отменить приглашение" : "Удалить участника"} onClick={() => remove(id, person?.username || person?.nick || "Участник", pending)}><XIcon /></button>}
    </div>;
    return <section className="habitMembers">
        <h3>Участники активности</h3>
        {loading && <div className="habitMembersSkeleton" aria-label="Загрузка участников" role="status"><div /><div /></div>}
        {error && <p role="alert">{error}</p>}
        {data && <>
            {row(data.owner, data.owner_id, "Владелец")}
            {data.chat ? <>
                <Link className={`contactsUser habitMember ${data.my_role ? "active" : ""}`} to={`/room/${data.chat.id}`}>
                    <div className="contactsUserPic">{data.chat.avatar_url ? <img className="contactsUserAvatar" src={data.chat.avatar_url} alt="" /> : <UsersIcon />}</div>
                    <div className="contactsUserInfo"><div className="contactsUserStr"><span className="nameSpan">{data.chat.name}</span></div><span className="habitMemberStatus">Беседа</span></div>
                </Link>
                {!data.access.is_owner && data.my_role && row({ id: user.id || "", nick: user.nick || "", username: user.username, avatar_url: user.avatar_url || null }, user.id || "", data.my_role)}
            </> : data.members.filter(member => member.user_id !== data.owner_id && member.status !== "declined").map(member => row(member.user, member.user_id, member.status === "pending" ? "Приглашён" : "Участник", data.access.is_owner, member.status === "pending"))}
        </>}
    </section>;
}
