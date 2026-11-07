import { X } from "@phosphor-icons/react";
import GetIconByType from "../../Chat/utils/getIconByType";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

interface commentsTAFilesProps {
    files:File[],
    setFiles?:Dispatch<SetStateAction<File[]>>
}
export default function CommentTAFiles ({files, setFiles} : commentsTAFilesProps) {
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    useEffect(() => {
        const next = files.map(file => ({ file, url: URL.createObjectURL(file) }));
        setPreviews(next);
        return () => next.forEach(preview => URL.revokeObjectURL(preview.url));
    }, [files]);

    return (
        <div className="chatTAFiles">
            {previews.map(({ file, url: previewUrl }, i) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                return (
                    <div key={i} className="chatTAFile">
                        <div className="chatTAFileOverlay" onClick={() => {
                            if (setFiles) setFiles(prev => prev.filter((_, idx) => idx !== i));
                        }}>
                            <X/>
                        </div>
                        {isImage ? (
                            <img src={previewUrl} alt={file.name} className="chatTAFilePreview" />
                        ) : isVideo ? (
                            <video src={previewUrl} className="chatTAFilePreview" preload="metadata" controls />
                        ) : (
                            <div className="chatTAFileOther">
                            {GetIconByType(file.name, file.type)}
                            <span className="chatTAFileName">{file.name}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    )
}