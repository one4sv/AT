import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { Media } from "../context/ChatContext";
import GetIconByType from "../../pages/Chat/utils/getIconByType";
import "../../scss/MediaDraft.scss";

interface MediaDraftProps {
    files: File[];
    media?: Media[];
    onRemove: (index: number) => void;
    disabled?: boolean;
}

export default function MediaDraft({ files, media = [], onRemove, disabled }: MediaDraftProps) {
    const { t } = useTranslation("acc");
    const [ previews, setPreviews ] = useState<{ file: File; url: string }[]>([]);
    useEffect(() => {
        const next = files.map(file => ({ file, url: URL.createObjectURL(file) }));
        setPreviews(next);
        return () => next.forEach(item => URL.revokeObjectURL(item.url));
    }, [files]);
    const items = [...media, ...previews.map(({ file, url }) => ({ name: file.name, type: file.type, url }))];
    if (!items.length) return null;

    return (
        <div className="mediaDraft">
            {items.map((file, index) => <div className="mediaDraftItem" key={file.url}>
                {file.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif)(?:[?#]|$)/i.test(file.url)
                    ? <img src={file.url} alt={file.name} />
                    : file.type?.startsWith("video/") || /\.(mp4|webm|mov)(?:[?#]|$)/i.test(file.url)
                        ? <video
                            src={file.url}
                            controls
                            preload="metadata"
                        />
                        : <span>
                            {GetIconByType(file.name, file.type || "")}{file.name}
                        </span>}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(index)}
                    aria-label={t("post.removeFile", { name: file.name })}
                >
                    <X />
                </button>
            </div>)}
        </div>
    );
}
