import type { Media, message } from "../../../components/context/ChatContext";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useUser } from "../../../components/hooks/UserHook";
import GetIconByType from "../utils/getIconByType";

export default function MessageFiles({files, m} : {files:Media[], m:message}) {
    const { setBlackout } = useBlackout()
    const { user } = useUser()
    const { chatWith } = useChat()
    const { openMenu } = useContextMenu()
    return (
        <div className="messageFiles">
            {files.map((file, j) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                return (
                    <div key={j} className="messageFile">
                        {isImage ? (
                            <img src={file.url} alt={file.name} className="messageFilePreview" onClick={() => setBlackout({seted:true, module:"ImgPrev", img:file.url})}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const isReacted = (() => {
                                    const reaction = m.reactions.find(r => r.user_id === user.id);
                                    return reaction ? reaction.reaction : "none";
                                })();
                                openMenu(e.clientX, e.clientY, "mess", { id:String(m.id), name:file.name, url:file.url }, undefined, undefined,
                                    { isReacted, isMy:m.sender_id === user.id, text:m.content, previewText: m.content ?? (m.files && m.files?.length > 0 ? `${m.files?.length} mediafile` : "Пересланное сообщение"),
                                    sender:m.sender_id === user.id ? user.username || user.nick! : chatWith.username || chatWith.nick! }
                                )
                            }}/>
                        ) : isVideo ? (
                            <video src={file.url} className="messageFilePreview" controls />
                        ) : (
                            <a href={file.url} download={file.name} className="messageFileOther">
                                {GetIconByType(file.name, file.type)}
                                <span className="messageFileName">{file.name}</span>
                            </a>
                        )}
                    </div>
                );
            })}
        </div>
    )
    
}