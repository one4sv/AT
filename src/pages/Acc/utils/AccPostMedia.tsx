import { X } from "@phosphor-icons/react";
import GetIconByType from "../../Chat/utils/getIconByType";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import type { Media } from "../../../components/context/ChatContext";

interface AccPostMediaProps {
    red: boolean;
    media?: Media[];
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
    keptMedia = [],
    newFiles = [],
    setKeptMedia = () => {},
    setNewFiles = () => {},
    inputFileRef
}: AccPostMediaProps) {
    const { setBlackout } = useBlackout()
    return (
        <div className="accPostmedia">
            {!red ? (
                media && media.length > 0 && (
                    <div className="postMediaGrid">
                        {media?.map((file, j) => {
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            return (
                                <div key={j} className="postFileGrid">
                                    {isImage ? (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            className="postFilePreview"
                                            onClick={() => setBlackout({ seted: true, module: "ImgPrev", img: file.url })}
                                        />
                                    ) : isVideo ? (
                                        <video src={file.url} className="postFilePreview" controls />
                                    ) : (
                                        <a href={file.url} download={file.name} className="postFileOther">
                                            {GetIconByType(file.name, file.type)}
                                            <span className="postFileName">{file.name}</span>
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
                                            alt={file.name}
                                            className="postFilePreview"
                                            onClick={() => setBlackout({ seted: true, module: "ImgPrev", img: file.url })}
                                        />
                                    ) : isVideo ? (
                                        <video src={file.url} className="postFilePreview" controls />
                                    ) : (
                                        <div className="postFileOther">
                                            {GetIconByType(file.name, file.type)}
                                            <span className="postFileName">{file.name}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {newFiles.map((file, i) => {
                            const previewUrl = URL.createObjectURL(file);
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
                                        <video src={previewUrl} className="postFilePreview" controls />
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
