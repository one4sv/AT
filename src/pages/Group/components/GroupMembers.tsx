import type { Member } from "../../../components/context/GroupContext";
import formatLastOnline from "../../../components/ts/utils/formatOnline";

export default function GroupMembers({members}: {members:Member[]}) {
    return (
        <div className="groupMembers">
            {members.map((member) => (
                <div key={member.id} className="groupMember">
                    {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name || member.nick} className="groupMemberPick"/>    
                    ) : (
                        <div className="groupMemberNoAva">{member.nick.charAt(0).toUpperCase()}</div>
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