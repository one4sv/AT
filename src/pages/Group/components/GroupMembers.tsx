import { useMemo, useState } from "react";
import { MagnifyingGlass as Search, UserCircleGear as Settings2, UserPlus, Users, X, User, CircleIcon } from "@phosphor-icons/react";
import { ChatTeardrop, CalendarBlank, Target, PushPin, ShareFat, Trash, Image, TextAa, TextAlignCenter, UserMinus, Prohibit, UserGear } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { Member, Perms } from "../../../components/context/GroupContext";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useUser } from "../../../components/hooks/UserHook";
import { useContacts } from "../../../components/hooks/ContactsHook";
const permissionIcons = { send_messages: ChatTeardrop, plan_complete: CalendarBlank, plan_comment: ChatTeardrop, goal_progress: Target, habit_complete: User, habit_comment: ChatTeardrop, habit_edit_blocks: TextAa, habit_edit_info: TextAa, habit_invite: UserPlus, change_avatar: Image, change_name: TextAa, change_desc: TextAlignCenter, manage_roles: UserGear, can_invite_users: UserPlus, kick_users: UserMinus, ban_users: Prohibit, delete_others: Trash, pin_messages: PushPin, redirect_messages: ShareFat };
const roleLabels: Record<string, string> = {
    owner: "groupUi.roleOwner",
    admin: "groupUi.roleAdmin",
    member: "groupUi.roleMember",
    user: "groupUi.roleMember"
};
export default function GroupMembers({
    members,
    myPerms
}: {
    members: Member[];
    myPerms: Perms | null;
}) {
    const { t } = useTranslation("common");
    const { openMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { user } = useUser();
    const { onlineMap } = useContacts();
    const [search, setSearch] = useState("");
    const filtered = useMemo(
        () => {
            const query = search.trim().toLocaleLowerCase();
            return members.filter(member => `${member.name ?? ""} ${member.nick}`.toLocaleLowerCase().includes(query)).sort(
                (a, b) => (b.role_name === "owner" ? 100 : b.role_rank ?? 0) - (a.role_name === "owner" ? 100 : a.role_rank ?? 0) || Number(Boolean(onlineMap[b.id])) - Number(Boolean(onlineMap[a.id]))
            );
        },
        [members, onlineMap, search]
    );
    const openPermissions = (member: Member) => {
        if (myPerms?.manage_roles) setBlackout({ seted: true, module: "PermissionsSettings", point: "member", options: { id: member.id } });
    };
    const showMenu = (member: Member, x: number, y: number) => openMenu(
        x,
        y,
        "member",
        {
            id: member.id,
            nick: member.nick,
            name: member.name || member.nick,
            onEdit: myPerms?.manage_roles ? () => openPermissions(member) : undefined
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
                        <Settings2 size={18} />Права и роли</button>}
                </div>}
            </div>
            {filtered.length ? <ul className="groupMemberList">
                {filtered.map(
                    member => <li
                        key={member.id}
                        className="groupMember"
                        data-context-menu="true"
                        data-context-menu-allow-button
                        onContextMenu={event => {
                            event.preventDefault();
                            showMenu(member, event.clientX, event.clientY);
                        }}
                    >
                        <button type="button" className="groupMemberLink" data-context-menu-allow-button onClick={() => openPermissions(member)} aria-label={member.name || member.nick}>
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
                            <span className="groupMemberRoleInfo">
                            <span
                                className={`groupMemberRole ${member.role_name === "owner" || member.role_name === "admin" ? "privileged" : ""}`}
                            >
                                {roleLabels[member.role_name] ? t(roleLabels[member.role_name]) : member.role_name || t("groupUi.roleMember")}
                            </span>
                            {!!Object.keys(member.permission_differences || {}).length && <span className="groupMemberOverrides">
                                {Object.entries(member.permission_differences || {}).slice(0, 3).map(([key, allowed]) => {
                                    const Icon = permissionIcons[key as keyof typeof permissionIcons];
                                    return Icon ? <span key={key} className={allowed ? "allowed" : "denied"} title={t(`groupUi.permission.${key}`)}><Icon size={16} /></span> : null;
                                })}
                                {Object.keys(member.permission_differences || {}).length > 3 && <small>+{Object.keys(member.permission_differences || {}).length - 3}</small>}
                            </span>}
                            </span>
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
        </div>
    );
}
