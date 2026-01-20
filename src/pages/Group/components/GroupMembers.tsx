import type { Member } from "../../../components/context/GroupContext";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { User, UserPlus } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";

export default function GroupMembers({members}: {members:Member[]}) {
    const { openMenu } = useContextMenu()
    const { setBlackout } = useBlackout();
    const navigate = useNavigate();
    
    return (
        <div className="groupMembers">
            <div className="groupMember" onClick={() => setBlackout({seted:true, module:"CreateChat", point:"InviteUser"})}>
                <div className="groupMemberNoAva">
                    <UserPlus />
                </div>
                <div className="groupMemberInfo">
                    <span className="groupMemberName" >Добавить участника</span>
                    <span className="groupMemberLastOnline"></span>
                </div>
            </div>
            {members.map((member) => (
                <div key={member.id} className="groupMember" onClick={() => {
                    navigate(`/chat/${member.nick}`)
                }}
                onContextMenu={(e) => {
                    e.preventDefault()
                    openMenu(e.clientX, e.clientY, "member", {id: member.id, nick: member.nick, name: member.name || member.nick})
                }}
                >
                    {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name || member.nick} className="groupMemberPick"/>    
                    ) : (
                        <div className="groupMemberNoAva"><User /></div>
                    )}                        
                    <div className="groupMemberInfo">
                        <span className="groupMemberName">{member.name ? member.name : member.nick}</span>
                        <span className="groupMemberLastOnline">{formatLastOnline(member.last_online)}</span>
                    </div>
                    <span className="groupMemberRole">{member.role ? member.role : "Участник"}</span>

                </div>
            ))}
        </div>
    )
}