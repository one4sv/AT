import "../../scss/modules/PermissionsDiv.scss";
import { useCallback, useEffect, useState } from "react";
import type { Member, Perms } from "../context/GroupContext";
import { useGroup } from "../hooks/GroupHook";
import { useUser } from "../hooks/UserHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import Loader from "../ts/Loader";
import TA from "../ts/TA";
import SelectList from "../ts/SelectList";
import { ArrowLeft, CaretDown, CaretRight, Image, TextAa, TextAlignCenter, User, UserGear, UserMinus, UserPlus, Prohibit, Trash, PushPin, ShareFat } from "@phosphor-icons/react";

export interface RoleType {
    role_id: string;
    role_name: string;
    permissions: Perms;
    is_editable: boolean;
    desc: string | null;
    is_default: boolean;
    rank: number;
}

export interface MemberPermType extends Member {
    permissions: Perms;
}

type Change = {
    target: "group" | "role" | "member";
    target_id: string;
    label: string;
    value: string | number | boolean | null;
};

type Selection = { type: "role" | "member"; id: string } | null;

const PERMISSIONS: { key: keyof Perms; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: "habit_complete", label: "Отмечать выполнения активностей", icon: User },
    { key: "habit_comment", label: "Комментировать активности", icon: TextAlignCenter },
    { key: "habit_edit_blocks", label: "Изменять блоки активностей", icon: TextAa },
    { key: "habit_edit_info", label: "Изменять информацию активностей", icon: TextAa },
    { key: "habit_invite", label: "Приглашать в активности", icon: UserPlus },
    { key: "change_avatar", label: "Изменять аватарку беседы", icon: Image },
    { key: "change_name", label: "Изменять название беседы", icon: TextAa },
    { key: "change_desc", label: "Изменять описание беседы", icon: TextAlignCenter },
    { key: "manage_roles", label: "Управлять ролями", icon: UserGear },
    { key: "can_invite_users", label: "Приглашать участников", icon: UserPlus },
    { key: "kick_users", label: "Исключать участников", icon: UserMinus },
    { key: "ban_users", label: "Банить участников", icon: Prohibit },
    { key: "delete_others", label: "Удалять чужие сообщения", icon: Trash },
    { key: "pin_messages", label: "Закреплять сообщения", icon: PushPin },
    { key: "redirect_messages", label: "Пересылать сообщения", icon: ShareFat }
];

export default function PermissionsSettings() {
    const { group, refetchGroup } = useGroup();
    const { user } = useUser();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();

    const [ roles, setRoles ] = useState<RoleType[]>([]);
    const [ members, setMembers ] = useState<MemberPermType[]>([]);
    const [ isOwner, setIsOwner ] = useState(false);
    const [ ownerId, setOwnerId ] = useState<string | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ saving, setSaving ] = useState(false);
    const [ error, setError ] = useState(false);
    const [ selection, setSelection ] = useState<Selection>(null);
    const [ expanded, setExpanded ] = useState({ roles: true, members: true });
    const [ changes, setChanges ] = useState<Change[]>([]);

    const loadPermissions = useCallback(async () => {
        if (!group.id) return;
        setLoading(true);
        setError(false);
        try {
            const res = await api.get("getpermissions/" + group.id);
            if (!res.data.success) throw new Error("Не удалось получить права");
            const nextRoles = (res.data.roles || []) as RoleType[];
            const nextMembers = (res.data.members || []) as MemberPermType[];

            setRoles([...nextRoles].sort((a, b) => b.rank - a.rank));
            setMembers(nextMembers);
            setIsOwner(res.data.is_owner === true);
            setOwnerId(res.data.owner_id || null);
        } catch {
            setError(true);
            showNotification("error", "Не удалось загрузить права беседы");
        } finally {
            setLoading(false);
        }
    }, [group.id]);

    useEffect(() => {
        void loadPermissions();
    }, [loadPermissions]);

    const editedValue = (
        target: Change["target"],
        targetId: string,
        label: string,
        original: Change["value"]
    ): Change["value"] => {
        const change = changes.find(item =>
            item.target === target && item.target_id === targetId && item.label === label
        );
        return change ? change.value : original;
    };

    const changeValue = (
        target: Change["target"],
        targetId: string,
        label: string,
        value: Change["value"],
        original: Change["value"]
    ) => {
        setChanges(prev => {
            const rest = prev.filter(item =>
                !(item.target === target && item.target_id === targetId && item.label === label)
            );
            return value === original ? rest : [...rest, { target, target_id: targetId, label, value }];
        });
    };

    const selectedRole = selection?.type === "role"
        ? roles.find(role => role.role_id === selection.id)
        : undefined;
    const selectedMember = selection?.type === "member"
        ? members.find(member => member.id === selection.id)
        : undefined;
    const myMember = members.find(member => member.id === user.id);
    const myRank = roles.find(role => role.role_id === myMember?.role_id)?.rank ?? 0;
    const selectedMemberRank = roles.find(role => role.role_id === selectedMember?.role_id)?.rank ?? 0;
    const isOwnerRole = (role: RoleType) => role.role_name.trim().toLowerCase() === "owner";
    const ownerRoleSelected = !!selectedRole && isOwnerRole(selectedRole);
    const canEditRole = !!selectedRole && !ownerRoleSelected && (
        isOwner || (selectedRole.is_editable && myRank > selectedRole.rank)
    );
    const canEditMember = !!selectedMember && selectedMember.id !== user.id && (
        isOwner || (selectedMember.id !== ownerId && myRank > selectedMemberRank)
    );
    const editable = selectedRole ? canEditRole : canEditMember;
    const target = selectedRole ? "role" : "member";
    const targetId = selectedRole?.role_id || selectedMember?.id || "";
    const permissions = selectedRole?.permissions || selectedMember?.permissions;
    const enabledCount = PERMISSIONS.filter(({ key }) =>
        ownerRoleSelected || !!editedValue(target, targetId, key, permissions?.[key] ?? false)
    ).length;
    const defaultRoleId = roles.find(role => role.is_default)?.role_id ?? null;
    const chosenDefaultRoleId = editedValue("group", group.id, "default_role_id", defaultRoleId);

    const save = async () => {
        if (saving || loading || changes.length === 0) return;

        const editedRoleNames = roles.map(role =>
            String(editedValue("role", role.role_id, "role_name", role.role_name) || "").trim()
        );
        if (editedRoleNames.some(name => !name)) {
            showNotification("error", "Название роли не может быть пустым");
            return;
        }

        setSaving(true);
        try {
            const payload = changes.map(change => (
                change.label === "role_name" && typeof change.value === "string"
                    ? { ...change, value: change.value.trim() }
                    : change
            ));
            const res = await api.post("editpermissions/" + group.id, payload);
            if (!res.data.success) throw new Error("Не удалось сохранить права");
            await refetchGroup(group.id);
            setBlackout({ seted: false });
        } catch {
            showNotification("error", "Не удалось сохранить права и роли");
            await loadPermissions();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rolesModal" role="dialog" aria-modal="true" aria-label="Права и роли">
            <div className="rolesModalHeader">
                <span>Права и роли</span>
            </div>

            {loading ? (
                <div className="rolesModalLoading"><Loader /></div>
            ) : error ? (
                <div className="rolesModalError">
                    <span>Не удалось загрузить права и роли</span>
                    <button type="button" onClick={() => void loadPermissions()}>Повторить</button>
                </div>
            ) : (
                <>
                    <div className="rolesModalViewport">
                        <div className={"rolesModalTrack" + (selection ? " showDetail" : "")}>
                            <div className="rolesModalPanel" inert={selection !== null}>
                                <section className="rolesModalSection">
                                    <button
                                        type="button"
                                        className="rolesModalSectionHead"
                                        aria-expanded={expanded.roles}
                                        onClick={() => setExpanded(prev => ({ ...prev, roles: !prev.roles }))}
                                    >
                                        <span>Роли</span>
                                        <span className="rolesModalSectionMeta">
                                            {roles.length}/10
                                            <CaretDown className={expanded.roles ? "expanded" : ""} size={20} />
                                        </span>
                                    </button>

                                    {expanded.roles && (
                                        <div className="rolesModalItems">
                                            {roles.length ? roles.map(role => (
                                                <button
                                                    type="button"
                                                    className="rolesModalItem"
                                                    key={role.role_id}
                                                    onClick={() => setSelection({ type: "role", id: role.role_id })}
                                                >
                                                    <span className="rolesModalItemText">
                                                        <span>{role.role_name}</span>
                                                        <small>
                                                            {role.is_default ? "Роль по умолчанию · " : ""}
                                                            Приоритет {role.rank}
                                                        </small>
                                                    </span>
                                                    <span className="rolesModalItemEnd">
                                                        {members.filter(member => member.role_id === role.role_id).length}
                                                        <CaretRight size={18} />
                                                    </span>
                                                </button>
                                            )) : <div className="rolesModalEmpty">Ролей пока нет</div>}

                                            {roles.length > 0 && (
                                                <div className="rolesModalDefault">
                                                    <label htmlFor="roles-default">Роль по умолчанию</label>
                                                    <SelectList
                                                        className={saving ? "rolesModalSelect rolesModalSelectLocked" : "rolesModalSelect"}
                                                        id="roles-default"
                                                        arr={[
                                                            { label: "Без роли", value: "" },
                                                            ...roles.filter(role => !isOwnerRole(role)).map(role => ({ label: role.role_name, value: role.role_id }))
                                                        ]}
                                                        selected={String(chosenDefaultRoleId ?? "")}
                                                        showOnly={saving}
                                                        onChange={value => changeValue(
                                                            "group", group.id, "default_role_id",
                                                            value || null, defaultRoleId
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>

                                <section className="rolesModalSection">
                                    <button
                                        type="button"
                                        className="rolesModalSectionHead"
                                        aria-expanded={expanded.members}
                                        onClick={() => setExpanded(prev => ({ ...prev, members: !prev.members }))}
                                    >
                                        <span>Участники</span>
                                        <span className="rolesModalSectionMeta">
                                            {members.length}
                                            <CaretDown className={expanded.members ? "expanded" : ""} size={20} />
                                        </span>
                                    </button>

                                    {expanded.members && (
                                        <div className="rolesModalItems">
                                            {members.length ? members.map(member => (
                                                <button
                                                    type="button"
                                                    className="rolesModalItem"
                                                    key={member.id}
                                                    onClick={() => setSelection({ type: "member", id: member.id })}
                                                >
                                                    <span className="rolesModalAvatar">
                                                        {member.avatar_url ? <img src={member.avatar_url} alt="" /> : <User size={24} />}
                                                    </span>
                                                    <span className="rolesModalItemText">
                                                        <span>{member.name || member.nick}</span>
                                                        <small>{member.id === user.id ? "Вы" : "@" + member.nick}</small>
                                                    </span>
                                                    <span className="rolesModalItemEnd">
                                                        <small>{member.id === ownerId ? "Владелец" : member.role_name || "Участник"}</small>
                                                        <CaretRight size={18} />
                                                    </span>
                                                </button>
                                            )) : <div className="rolesModalEmpty">Участников пока нет</div>}
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="rolesModalPanel" inert={selection === null}>
                                {(selectedRole || selectedMember) && (
                                    <div className="rolesModalDetail">
                                        <div className="rolesModalIdentity">
                                            {selectedMember && (
                                                <span className="rolesModalAvatar">
                                                    {selectedMember.avatar_url ? (
                                                        <img src={selectedMember.avatar_url} alt="" />
                                                    ) : <User size={24} />}
                                                </span>
                                            )}
                                            <div className="rolesModalItemText">
                                                <span>{selectedRole ? selectedRole.role_name : selectedMember?.name || selectedMember?.nick}</span>
                                                <small>
                                                    {selectedRole
                                                        ? ownerRoleSelected ? "Системная роль владельца — только просмотр" : "Редактирование роли"
                                                        : selectedMember?.id === ownerId ? "Владелец" : "Права участника"}
                                                </small>
                                            </div>
                                        </div>

                                        {selectedRole && (
                                            <div className="rolesModalFields">
                                                <label>
                                                    Название роли
                                                    <input
                                                        type="text"
                                                        value={String(editedValue("role", selectedRole.role_id, "role_name", selectedRole.role_name) ?? "")}
                                                        disabled={!canEditRole || saving}
                                                        onChange={event => changeValue(
                                                            "role", selectedRole.role_id, "role_name",
                                                            event.target.value, selectedRole.role_name
                                                        )}
                                                    />
                                                </label>
                                                <label>
                                                    Приоритет
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={99}
                                                        value={Number(editedValue("role", selectedRole.role_id, "rank", selectedRole.rank))}
                                                        disabled={!canEditRole || saving}
                                                        onChange={event => {
                                                            const value = Number(event.target.value);
                                                            if (value >= 1 && value <= 99) {
                                                                changeValue("role", selectedRole.role_id, "rank", value, selectedRole.rank);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        )}

                                        {selectedMember && roles.length > 0 && (
                                            <div className="rolesModalFields">
                                                <label>
                                                    Роль участника
                                                    <SelectList
                                                        key={selectedMember.id}
                                                        className={!canEditMember || saving ? "rolesModalSelect rolesModalSelectLocked" : "rolesModalSelect"}
                                                        arr={[
                                                            { label: "Без роли", value: "" },
                                                            ...roles
                                                                .filter(role => !isOwnerRole(role) || role.role_id === selectedMember.role_id)
                                                                .filter(role => isOwner || role.rank < myRank || role.role_id === selectedMember.role_id)
                                                                .map(role => ({ label: role.role_name, value: role.role_id }))
                                                        ]}
                                                        selected={String(editedValue("member", selectedMember.id, "role_id", selectedMember.role_id || null) ?? "")}
                                                        showOnly={!canEditMember || saving}
                                                        onChange={value => changeValue(
                                                            "member", selectedMember.id, "role_id",
                                                            value || null, selectedMember.role_id || null
                                                        )}
                                                    />
                                                </label>
                                            </div>
                                        )}

                                        <div className="rolesModalPermissionsHeading">
                                            <span>Разрешения</span>
                                            <span>{enabledCount}/{PERMISSIONS.length}</span>
                                        </div>

                                        <div className="rolesModalPermissions">
                                            {PERMISSIONS.map(({ key, label, icon: Icon }) => {
                                                const active = ownerRoleSelected || !!editedValue(target, targetId, key, permissions?.[key] ?? false);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={key}
                                                        className="rolesModalPermission"
                                                        aria-pressed={active}
                                                        disabled={!editable || saving}
                                                        onClick={() => changeValue(target, targetId, key, !active, permissions?.[key] ?? false)}
                                                    >
                                                        <span className="rolesModalPermissionText">
                                                            <Icon size={20} />
                                                            <span>{label}</span>
                                                        </span>
                                                        <span className={"rolesModalSwitch" + (active ? " active" : "")} aria-hidden="true">
                                                            <span />
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {selectedRole && (
                                            <div className="rolesModalFields">
                                                <label>
                                                    Описание роли
                                                    <TA
                                                        minHeight={5}
                                                        maxHeight={40}
                                                        value={String(editedValue("role", selectedRole.role_id, "desc", selectedRole.desc) ?? "")}
                                                        disabled={!canEditRole || saving}
                                                        onChange={event => changeValue(
                                                            "role", selectedRole.role_id, "desc",
                                                            event.target.value || null, selectedRole.desc
                                                        )}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rolesModalFooter">
                        {selection && (
                            <button
                                type="button"
                                className="rolesModalBack"
                                onClick={() => setSelection(null)}
                            >
                                <ArrowLeft size={21} />
                                Назад
                            </button>
                        )}
                        <button
                            type="button"
                            className="rolesModalSave"
                            disabled={saving || changes.length === 0}
                            onClick={() => void save()}
                        >
                            {saving ? "Сохраняем…" : "Сохранить"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
