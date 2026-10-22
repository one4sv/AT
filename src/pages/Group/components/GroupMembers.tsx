import { useMemo, useState } from "react";
import { DotsThree as MoreHorizontal, MagnifyingGlass as Search, UserCircleGear as Settings2, UserPlus, Users, X, User, CircleIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { Member, Perms } from "../../../components/context/GroupContext";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useUser } from "../../../components/hooks/UserHook";
import { useContacts } from "../../../components/hooks/ContactsHook";
const roleLabels: Record<string, string> = {
    owner: "Владелец",
    admin: "Администратор",
    member: "Участник",
    user: "Участник"
};
export default function GroupMembers({
    members,
    myPerms
}: {
    members: Member[];
    myPerms: Perms | null;
}) {
    const { openMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { user } = useUser();
    const { onlineMap } = useContacts();
    const [search, setSearch] = useState("");
    const filtered = useMemo(
        () => {
            const query = search.trim().toLocaleLowerCase();
            return members.filter(member => `${member.name ?? ""} ${member.nick}`.toLocaleLowerCase().includes(query)).sort(
                (a, b) => Number(Boolean(onlineMap[b.id])) - Number(Boolean(onlineMap[a.id]))
            );
        },
        [members, onlineMap, search]
    );
    const showMenu = (member: Member, x: number, y: number) => openMenu(
        x,
        y,
        "member",
        {
            id: member.id,
            nick: member.nick,
            name: member.name || member.nick
        },
        undefined,
        undefined,
        undefined,
        {
            isMe: user.id === member.id,
            myPerms
        }
    );

    return (
        <div className="groupMembers">
            <div className="groupMembersToolbar">
                <div className="groupSearch">
                    <Search size={18} aria-hidden="true" />
                    <input
                        type="search"
                        aria-label="Поиск участников"
                        placeholder="Имя или ник участника"
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                    />
                    {search && <button type="button" aria-label="Очистить поиск" onClick={() => setSearch("")}>
                        <X size={16} />
                    </button>}
                </div>
                {(myPerms?.can_invite_users || myPerms?.manage_roles) && <div className="groupMemberActions">
                    {myPerms.can_invite_users && <button
                        type="button"
                        className="settingInnerButt"
                        onClick={() => setBlackout(
                            {
                                seted: true,
                                module: "CreateChat",
                                point: "InviteUser"
                            }
                        )}
                    >
                        <UserPlus size={18} />Пригласить</button>}
                    {myPerms.manage_roles && <button
                        type="button"
                        className="settingInnerButt"
                        onClick={() => setBlackout(
                            {
                                seted: true,
                                module: "PermissionsSettings"
                            }
                        )}
                    >
                        <Settings2 size={18} />Права доступа</button>}
                </div>}
            </div>
            {filtered.length ? <ul className="groupMemberList">
                {filtered.map(
                    member => <li
                        key={member.id}
                        className="groupMember"
                        data-context-menu="true"
                        onContextMenu={event => {
                            event.preventDefault();
                            showMenu(member, event.clientX, event.clientY);
                        }}
                    >
                        <Link className="groupMemberLink" to={`/chat/${member.nick}`}>
                            <span className="groupMemberAvatar">
                                {member.avatar_url ? <img src={member.avatar_url} alt="" loading="lazy" /> : <span>
                                    <User size={28} />
                                </span>}
                                {onlineMap[member.id] && <i />}
                            </span>
                            <span className="groupMemberInfo">
                                <span className="groupMemberName">
                                    {member.name || member.nick}
                                    {user.id === member.id && <small>Вы</small>}
                                </span>
                                <span className={`groupMemberLastOnline ${onlineMap[member.id] ? "online" : ""}`}>
                                    {onlineMap[member.id] && <CircleIcon size={12} weight="fill" aria-hidden="true" />}
                                    {onlineMap[member.id] ? "В сети" : formatLastOnline(member.last_online)}
                                </span>
                            </span>
                            <span
                                className={`groupMemberRole ${member.role_name === "owner" || member.role_name === "admin" ? "privileged" : ""}`}
                            >
                                {roleLabels[member.role_name] || member.role_name || "Участник"}
                            </span>
                        </Link>
                        <button
                            type="button"
                            className="groupMemberMenu"
                            aria-label={`Действия: ${member.name || member.nick}`}
                            onClick={event => {
                                const rect = event.currentTarget.getBoundingClientRect();
                                showMenu(member, rect.left, rect.bottom);
                            }}
                        >
                            <MoreHorizontal size={20} />
                        </button>
                    </li>
                )}
            </ul> : <div className="groupMembersEmpty">
                <Users size={28} aria-hidden="true" />
                <h2>
                    {search.trim() ? "Никого не нашли" : "Пока нет участников"}
                </h2>
                <p>
                    {search.trim() ? "Попробуйте другое имя или ник." : "Участники группы появятся здесь."}
                </p>
                {search.trim() && <button type="button" className="settingInnerButt" onClick={() => setSearch("")}>Сбросить поиск</button>}
            </div>}
            <div className="groupSearchStatus" role="status">
                <Users size={20} weight="fill" aria-hidden="true" />
                <span>
                    {search.trim() ? `Найдено: ${filtered.length}` : `Всего участников: ${members.length}`}
                </span>
            </div>
        </div>
    );
}
