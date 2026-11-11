import { useEffect, useState, type MouseEventHandler } from "react";
import { ImageSquareIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/SettingsHook";

interface TrafficImageProps {
    src: string;
    alt: string;
    className: string;
    mimeType?: string;
    contextMenu?: boolean;
    skeleton?: boolean;
    onClick?: MouseEventHandler<HTMLImageElement>;
    onContextMenu?: MouseEventHandler<HTMLImageElement>;
}

export default function TrafficImage({ src, alt, className, mimeType, contextMenu, skeleton = false, onClick, onContextMenu }: TrafficImageProps) {
    const { t } = useTranslation("settings");
    const { autoLoadImages, autoPlayGif } = useSettings();
    const [allowed, setAllowed] = useState(false);
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    useEffect(() => setAllowed(false), [src]);

    const gif = mimeType === "image/gif" || /\.gif(?:$|[?#])/i.test(src);
    const blocked = (!autoLoadImages || (gif && !autoPlayGif)) && !allowed;

    if (blocked) return (
        <button type="button" className={`${className} trafficMediaPlaceholder`}
            data-context-menu={contextMenu ? "true" : undefined}
            data-context-menu-allow-button="true"
            onClick={event => { event.stopPropagation(); setAllowed(true); }}
            onContextMenu={onContextMenu as unknown as MouseEventHandler<HTMLButtonElement> | undefined}
            aria-label={t(gif ? "general.tapToLoadGif" : "general.tapToLoad")}>
            <ImageSquareIcon size={24}/>
            <span>{t(gif ? "general.tapToLoadGif" : "general.tapToLoad")}</span>
        </button>
    );

    if (skeleton && failedSrc === src) return (
        <div className={`${className} messageMediaFailed`} role="img" aria-label={alt}>
            <ImageSquareIcon size={24} aria-hidden="true"/>
        </div>
    );

    return <>
        {skeleton && loadedSrc !== src && <span className="skeletonBlock messageFileSkeleton" aria-hidden="true"/>}
        <img src={src} alt={alt} className={`${className}${skeleton && loadedSrc !== src ? " messageMediaPending" : ""}`}
            loading="lazy" decoding="async"
            data-context-menu={contextMenu ? "true" : undefined}
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailedSrc(src)}
            onClick={onClick} onContextMenu={onContextMenu}/>
    </>;
}
