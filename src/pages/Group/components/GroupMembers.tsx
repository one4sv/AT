import type { Member, Perms } from "../../../components/context/GroupContext";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { User, UserCircleGear, UserPlus } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useUser } from "../../../components/hooks/UserHook";
import { useChat } from "../../../components/hooks/ChatHook";

export default function GroupMembers({members, myPerms}: {members:Member[], myPerms:Perms | null}) {
    const { openMenu } = useContextMenu()
    const { setBlackout } = useBlackout();
    const { user } = useUser();
    const { onlineMap } = useChat()
    const navigate = useNavigate();
    
    return (
        <div className="groupMembers">
            {(myPerms?.manage_roles || myPerms?.can_invite_users) && (
                <div className="groupMembersSettings" >
                    {myPerms?.can_invite_users && (
                        <div className="groupMemberSettingsWrapper add" onClick={() => setBlackout({seted:true, module:"CreateChat", point:"InviteUser"})}>
                            <div className="groupMemberNoAva gmsIcon">
                                <UserPlus />
                            </div>
                            <span className="groupMemberSettingName">Добавить участника</span>
                        </div>
                    )}
                    {myPerms?.manage_roles && myPerms?.can_invite_users && <div className="gmsVline"/>}
                    {myPerms?.manage_roles && (
                        <div className="groupMemberSettingsWrapper rights" onClick={() => {
                            setBlackout({seted:true, module:"PermissionsSettings"})
                        }}>
                            <div className="groupMemberNoAva gmsIcon">
                                <UserCircleGear  />
                            </div>
                            <span className="groupMemberSettingName" >Настроить права</span>
                        </div>
                    )}
                </div>
            )}
            {(myPerms?.manage_roles || myPerms?.can_invite_users) && <div className="gmHline"></div>}
            {members.map((member) => (
                <div key={member.id} className="groupMember" onClick={() => {
                    navigate(`/chat/${member.nick}`)
                }}
                onContextMenu={(e) => {
                    e.preventDefault()
                    openMenu(e.clientX, e.clientY, "member", {id: member.id, nick: member.nick, name: member.name || member.nick}, undefined, undefined, undefined, { isMe: user.id === member.id, myPerms:myPerms})
                }}
                >
                    {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name || member.nick} className="groupMemberPick"/>    
                    ) : (
                        <div className="groupMemberNoAva"><User /></div>
                    )}                        
                    <div className="groupMemberInfo">
                        <span className="groupMemberName">{member.name ? member.name : member.nick}</span>
                        <span className="groupMemberLastOnline">
                            {onlineMap[member?.id || ""]
                                ? "В сети"
                                : formatLastOnline(member?.last_online)}
                        </span>
                    </div>
                    <span className="groupMemberRole">{member.role_name ? member.role_name : "Участник"}</span>

                </div>
            ))}
        </div>
    )
}