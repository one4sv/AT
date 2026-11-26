import { Background } from "./utils/background";
import { getStockScenePreviewSources } from "./utils/BackgroundScene";
import { ImageSquareIcon } from "@phosphor-icons/react";
import "../../scss/WallpaperShareThumbnail.scss";

export default function WallpaperShareThumbnail({ id, url, blocked = false }: { id?: string; url?: string; blocked?: boolean }) {
    const photo = id ? getStockScenePreviewSources(id) : null;
    return <span className="wallpaperShareThumbnail" aria-hidden="true">
        {blocked ? <ImageSquareIcon size={22}/> : url || photo ? <img src={url || photo?.desktop} alt="" loading="lazy" decoding="async"/> :
            id ? <Background previewBg={id} previewEffects={{ blur: 0, movement: false, filter: "none", speed: 0 }}/> : <ImageSquareIcon size={22}/>}
    </span>;
}
