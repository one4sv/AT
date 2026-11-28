import { useRef, useState } from "react";
import VideoControls, { useDesktopVideoControls } from "../../../components/ts/VideoControls";
import { firstFramePoster, videoPreviewSource } from "../../../components/ts/utils/videoPlayback";
import type { Media, message } from "../../../components/context/ChatContext";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useUser } from "../../../components/hooks/UserHook";
import GetIconByType from "./getIconByType";
import TrafficImage from "../../../components/ts/TrafficImage";
import { useSettings } from "../../../components/hooks/SettingsHook";
import "../../../scss/Loading.scss";

function MessageVideoPreview({ src, preload }: { src: string; preload: "metadata" | "none" }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const desktop = useDesktopVideoControls();
    const [resolved, setResolved] = useState(false);
    const [ratio, setRatio] = useState(4 / 3);
    const [poster, setPoster] = useState<string | undefined>();
    const showFirstFrame = (video: HTMLVideoElement) => {
        setResolved(true);
        if (!poster && video.paused && video.currentTime < .1) {
            const frame = firstFramePoster(video);
            if (frame) setPoster(frame);
        }
    };

    return <>
        {preload === "metadata" && !resolved && <span className="skeletonBlock messageFileSkeleton" aria-hidden="true"/>}
        <video ref={videoRef} src={videoPreviewSource(src, preload)} className={`messageFilePreview${preload === "metadata" && !resolved ? " messageMediaPending" : ""}`}
            preload={preload} controls={!desktop} playsInline poster={poster}
            style={{ aspectRatio: ratio }}
            onLoadedMetadata={event => {
                const video = event.currentTarget;
                // Keep controls usable even if Safari defers frame decoding.
                setResolved(true);
                if (video.videoWidth && video.videoHeight) {
                    const nextRatio = video.videoWidth / video.videoHeight;
                    setRatio(nextRatio);
                    video.parentElement?.style.setProperty("--message-video-ratio", String(nextRatio));
                }
            }}
            onLoadedData={event => showFirstFrame(event.currentTarget)}
            onSeeked={event => showFirstFrame(event.currentTarget)}
            onPlay={() => setResolved(true)} onError={() => setResolved(true)}/>
        {desktop && <VideoControls videoRef={videoRef}/>}
    </>;
}

export default function MessageFiles({files, m} : {files:Media[], m:message}) {
    const { t } = useTranslation("common");
    const { autoLoadImages } = useSettings();
    const { chatWith } = useChat()
    const { setBlackout } = useBlackout()
    const { user } = useUser()
    const { openMenu } = useContextMenu()
    
    const imageFiles = files.filter(file => /^(image|video)\//i.test(file.type || ""));

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
                type: image.type,
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
        <div className={`messageFiles ${files.length === 1 ? "single" : ""}${files.every(file => !/^(image|video)\//i.test(file.type || "")) ? " documentsOnly" : ""}`}>
            {files.map((file, j) => {
                const isImage = /^(image)\//i.test(file.type || "");
                const isVideo = /^(video)\//i.test(file.type || "");
                return (
                    <div key={j} className={`messageFile${isVideo ? " videoFile" : !isImage ? " documentFile" : ""}`} data-context-menu="true"
                        onContextMenu={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            openMenu(event.clientX, event.clientY, "media", {
                                id: String(m.id),
                                nick: chatWith ? chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick : undefined,
                                url: file.url,
                                name: file.name,
                                type: file.type
                            });
                        }}
                    >
                        {isImage ? (
                            <TrafficImage src={file.url} alt={file.name} mimeType={file.type} className="messageFilePreview" skeleton contextMenu onClick={event => {
                                event.stopPropagation();
                                openImage(file);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const isReacted = (() => {
                                    const reaction = m.reactions.find(r => r.user_id === user.id);
                                    return reaction ? reaction.reaction : "none";
                                })();
                                openMenu(e.clientX, e.clientY, "mess", { id:String(m.id), name:file.name, url:file.url, type:file.type }, undefined, undefined,
                                    { isReacted, isMy:m.sender_id === user.id, text:m.content, previewText: m.content ?? (m.files && m.files?.length > 0 ? t("chatUi.mediaCount", { count: m.files?.length }) : t("chatUi.forwardedMessage")),
                                    sender:m.sender_name }
                                )
                            }}/>
                        ) : isVideo ? (
                            <MessageVideoPreview key={file.url} src={file.url}
                                preload={autoLoadImages ? "metadata" : "none"}/>
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