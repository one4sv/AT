import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import GetIconByType from "../../Chat/utils/getIconByType";
import useImagePreview from "../../../components/hooks/utils/useImagePreview";
import TrafficImage from "../../../components/ts/TrafficImage";
import { useSettings } from "../../../components/hooks/SettingsHook";
import type { Media } from "../../../components/context/ChatContext";

function normalizePostFileName(name: string) {
    if (!/[ÐÑ]/.test(name) || [...name].some(char => char.charCodeAt(0) > 255)) return name;
    try {
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array([...name].map(char => char.charCodeAt(0))));
        return /[\u0400-\u04FF]/.test(decoded) ? decoded : name;
    } catch {
        return name;
    }
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
    const { autoLoadImages, autoPlayGif } = useSettings();
    const [newFilePreviews, setNewFilePreviews] = useState<{ file: File; url: string }[]>([]);
    useEffect(() => {
        if (!red) return;
        const previews = newFiles.map(file => ({ file, url: URL.createObjectURL(file) }));
        setNewFilePreviews(previews);
        return () => previews.forEach(preview => URL.revokeObjectURL(preview.url));
    }, [newFiles, red]);
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
                                <div key={j} className="postFileGrid">
                                    {isImage ? (
                                        <TrafficImage
                                            src={file.url}
                                            alt={fileName}
                                            mimeType={file.type}
                                            className="postFilePreview"
                                            onClick={event => openImage(file, event)}
                                        />
                                    ) : isVideo ? (
                                        <video src={file.url} className="postFilePreview" preload={autoLoadImages && autoPlayGif ? "metadata" : "none"} controls />
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
                                        <video src={file.url} className="postFilePreview" preload="metadata" controls />
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
                                        <video src={previewUrl} className="postFilePreview" preload="metadata" controls />
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
