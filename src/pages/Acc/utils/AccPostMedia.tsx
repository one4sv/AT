import { videoPreviewSource } from "../../../components/ts/utils/videoPlayback";
import { X } from "@phosphor-icons/react";
import { useEffect, useState, type MouseEvent } from "react";
import GetIconByType from "../../Chat/utils/getIconByType";
import useImagePreview from "../../../components/hooks/utils/useImagePreview";
import TrafficImage from "../../../components/ts/TrafficImage";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import type { Media } from "../../../components/context/ChatContext";
import "../../../scss/Loading.scss";

function normalizePostFileName(name: string) {
    if (!/[ÐÑ]/.test(name) || [...name].some(char => char.charCodeAt(0) > 255)) return name;
    try {
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array([...name].map(char => char.charCodeAt(0))));
        return /[\u0400-\u04FF]/.test(decoded) ? decoded : name;
    } catch {
        return name;
    }
}

function PostVideoPreview({ src, preload }: { src: string; preload: "metadata" | "none" }) {
    const [resolved, setResolved] = useState(false);
    const pending = preload === "metadata" && !resolved;

    return <>
        {pending && <span className="skeletonBlock messageFileSkeleton" aria-hidden="true"/>}
        <video src={videoPreviewSource(src, preload)} className={`postFilePreview${pending ? " messageMediaPending" : ""}`}
            preload={preload} controls playsInline onLoadedData={() => setResolved(true)} onPlay={() => setResolved(true)}
            onError={() => setResolved(true)}/>
    </>;
}

const emptyNewFiles: File[] = [];

interface AccPostMediaProps {
    red: boolean;
    media?: Media[];
    gallery?: Media[];
    keptMedia?: { url: string; name: string; type: string }[];
    newFiles?: File[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setKeptMedia?: React.Dispatch<React.SetStateAction<any[]>>;
    setNewFiles?: React.Dispatch<React.SetStateAction<File[]>>;
    inputFileRef?: React.RefObject<HTMLInputElement | null>;
}

export default function AccPostMedia({
    red,
    media,
    gallery,
    keptMedia = [],
    newFiles = emptyNewFiles,
    setKeptMedia = () => {},
    setNewFiles = () => {},
    inputFileRef
}: AccPostMediaProps) {
    const openImage = useImagePreview(gallery || (red ? keptMedia : media) || []);
    const { autoLoadImages } = useSettings();
    const { openMenu } = useContextMenu();
    const [newFilePreviews, setNewFilePreviews] = useState<{ file: File; url: string }[]>([]);
    useEffect(() => {
        if (!red) return;
        const previews = newFiles.map(file => ({ file, url: URL.createObjectURL(file) }));
        setNewFilePreviews(previews);
        return () => previews.forEach(preview => URL.revokeObjectURL(preview.url));
    }, [newFiles, red]);
    const openMediaMenu = (event: MouseEvent<HTMLDivElement>, file: Media) => {
        event.preventDefault();
        event.stopPropagation();
        openMenu(event.clientX, event.clientY, "media", {
            id: "",
            name: normalizePostFileName(file.name),
            url: file.url,
            type: file.type
        });
    };

    return (
        <div className="accPostmedia">
            {!red ? (
                media && media.length > 0 && (
                    <div className="postMediaGrid">
                        {media?.map((file, j) => {
                            const fileName = normalizePostFileName(file.name);
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            return (
                                <div key={j} className="postFileGrid"
                                    data-context-menu="true"
                                    onContextMenu={event => openMediaMenu(event, file)}
                                >
                                    {isImage ? (
                                        <TrafficImage
                                            src={file.url}
                                            alt={fileName}
                                            mimeType={file.type}
                                            className="postFilePreview"
                                            contextMenu
                                            skeleton
                                            onClick={event => openImage(file, event)}
                                        />
                                    ) : isVideo ? (
                                        <PostVideoPreview key={file.url} src={file.url} preload={autoLoadImages ? "metadata" : "none"}/>
                                    ) : (
                                        <a href={file.url} download={fileName} className="postFileOther">
                                            {GetIconByType(fileName, file.type)}
                                            <span className="postFileName">{fileName}</span>
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                (keptMedia.length > 0 || newFiles.length > 0) && (
                    <div className="postMediaGrid">
                        {keptMedia.map((file, j) => {
                            const fileName = normalizePostFileName(file.name);
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            return (
                                <div key={`kept-${j}`} className="postFileGrid">
                                    <div
                                        className="chatTAFileOverlay"
                                        onClick={() => setKeptMedia(prev => prev.filter((_, idx) => idx !== j))}
                                    >
                                        <X />
                                    </div>
                                    {isImage ? (
                                        <img
                                            src={file.url}
                                            alt={fileName}
                                            className="postFilePreview"
                                            loading="lazy" decoding="async"
                                            onClick={event => openImage(file, event)}
                                        />
                                    ) : isVideo ? (
                                        <video src={file.url} className="postFilePreview" preload="metadata" controls playsInline />
                                    ) : (
                                        <div className="postFileOther">
                                            {GetIconByType(fileName, file.type)}
                                            <span className="postFileName">{fileName}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {newFilePreviews.map(({ file, url: previewUrl }, i) => {
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            return (
                                <div key={`new-${i}`} className="postFileGrid">
                                    <div
                                        className="chatTAFileOverlay"
                                        onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                                    >
                                        <X />
                                    </div>
                                    {isImage ? (
                                        <img src={previewUrl} alt={file.name} className="postFilePreview" />
                                    ) : isVideo ? (
                                        <video src={previewUrl} className="postFilePreview" preload="metadata" controls playsInline />
                                    ) : (
                                        <div className="postFileOther">
                                            {GetIconByType(file.name, file.type)}
                                            <span className="postFileName">{file.name}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            <input
                type="file"
                multiple
                style={{ display: "none" }}
                ref={inputFileRef}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = e.target.files;
                    if (!files) return;
                    setNewFiles(prev => [...prev, ...Array.from(files)]);
                }}
            />
        </div>
    );
}
