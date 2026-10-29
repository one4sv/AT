import type { Media, message } from "../../../components/context/ChatContext";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useUser } from "../../../components/hooks/UserHook";
import GetIconByType from "./getIconByType";

export default function MessageFiles({files, m} : {files:Media[], m:message}) {
    const { chatWith } = useChat()
    const { setBlackout } = useBlackout()
    const { user } = useUser()
    const { openMenu } = useContextMenu()
    
    const imageFiles = files.filter(file => file.type.startsWith("image/"));

    const openImage = (file: Media) => {
        const sender = {
            name: m.sender_name,
            nick: m.sender_nick,
            url: (chatWith && chatWith.is_group
                ? m.sender_avatar_url
                : chatWith?.id === m.sender_id
                    ? chatWith.avatar_url
                    : user.avatar_url) ?? "",
            id: m.sender_id
        };

        const options = {
            nick: chatWith
                ? chatWith.is_group
                    ? `g/${chatWith.id}`
                    : chatWith.nick
                : undefined,
            id: String(m.id),
            name: file.name,
            url: file.url
        };

        setBlackout({
            seted: true,
            module: "ImgPrev",
            img: file.url,
            images: imageFiles.map(image => ({
                url: image.url,
                name: image.name,
                options: {
                    ...options,
                    name: image.name,
                    url: image.url
                },
                sender
            })),
            imageIndex: imageFiles.findIndex(image => image.url === file.url),
            options,
            sender
        });
    };

    return (
        <div className="messageFiles">
            {files.map((file, j) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                return (
                    <div key={j} className="messageFile">
                        {isImage ? (
                            <img src={file.url} alt={file.name} className="messageFilePreview" onClick={event => {
                                event.stopPropagation();
                                openImage(file);
                            }}
                            data-context-menu="true"
                            onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const isReacted = (() => {
                                    const reaction = m.reactions.find(r => r.user_id === user.id);
                                    return reaction ? reaction.reaction : "none";
                                })();
                                openMenu(e.clientX, e.clientY, "mess", { id:String(m.id), name:file.name, url:file.url }, undefined, undefined,
                                    { isReacted, isMy:m.sender_id === user.id, text:m.content, previewText: m.content ?? (m.files && m.files?.length > 0 ? `${m.files?.length} mediafile` : "Пересланное сообщение"),
                                    sender:m.sender_name }
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