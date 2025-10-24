import { X } from "@phosphor-icons/react";
import GetIconByType from "../../Chat/utils/getIconByType";
import type { Dispatch, SetStateAction } from "react";

interface commentsTAFilesProps {
    files:File[],
    setFiles?:Dispatch<SetStateAction<File[]>>
}
export default function CommentTAFiles ({files, setFiles} : commentsTAFilesProps) {
    return (
        <div className="chatTAFiles">
            {files.map((file, i) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                const previewUrl = URL.createObjectURL(file);
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
                            <video src={previewUrl} className="chatTAFilePreview" controls />
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