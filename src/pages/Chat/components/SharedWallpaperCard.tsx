import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useNote } from "../../../components/hooks/NoteHook";
import { MAX_CUSTOM_BACKGROUNDS, shareableWallpapers, parseSharedWallpaperLink } from "../../../components/ts/utils/backgroundCatalog";
import { fetchWallpaperFile } from "../../../components/ts/utils/fetchWallpaperFile";
import WallpaperShareThumbnail from "../../../components/ts/WallpaperShareThumbnail";
import type { Media } from "../../../components/context/ChatContext";
import "../scss/SharedEntityCard.scss";

export default function SharedWallpaperCard({ target, media }: { target: NonNullable<ReturnType<typeof parseSharedWallpaperLink>>; media?: Media }) {
    const { t } = useTranslation("settings");
    const navigate = useNavigate();
    const { bgGallery, settingsLoaded, autoLoadImages, autoPlayGif } = useSettings();
    const { setBlackout } = useBlackout();
    const { openMenu } = useContextMenu();
    const { showNotification } = useNote();
    const [busy, setBusy] = useState(false);
    const stock = target.kind === "stock" ? shareableWallpapers.find(item => item.id === target.id) : undefined;
    const open = async () => {
        if (target.kind === "stock") {
            navigate("/wallpapers?preview=" + encodeURIComponent(target.id));
            return;
        }
        if (!settingsLoaded || busy) return;
        if (bgGallery.length >= MAX_CUSTOM_BACKGROUNDS) {
            showNotification("error", t("backgroundLibrary.shareFull", { count: MAX_CUSTOM_BACKGROUNDS }));
            return;
        }
        if (!media) {
            showNotification("error", t("backgroundLibrary.shareUnavailable"));
            return;
        }
        setBusy(true);
        try {
            const file = await fetchWallpaperFile(media.url, "media");
            setBlackout({ seted: true, module: "BgHandler", bg: file });
        } catch {
            showNotification("error", t("backgroundLibrary.shareUnavailable"));
        } finally { setBusy(false); }
    };
    return <div className="sharedEntityCard sharedWallpaperCard" data-context-menu="true" onContextMenu={event => {
        event.preventDefault(); event.stopPropagation();
        const url = target.kind === "stock" ? new URL("/wallpapers?shared=" + encodeURIComponent(target.id), window.location.origin).href : new URL("/wallpapers?shared=custom", window.location.origin).href;
        if (!url) return;
        openMenu(event.clientX, event.clientY, "sharedSetting", { id: "shared-object", url, onOpen: () => void open(), onShare: () => setBlackout({seted:true,module:"ShareObject",shareObject:{url,asset:media?.url,bucket:"media"}}) });
    }} onDoubleClick={event => event.stopPropagation()}>
        <button type="button" className="sharedEntityLink" disabled={busy || (target.kind === "custom" && !settingsLoaded)}
            aria-busy={busy} onClick={event => { event.stopPropagation(); void open(); }}>
            <WallpaperShareThumbnail id={stock?.id} url={media?.url} blocked={target.kind === "custom" && (!autoLoadImages || (media?.type === "image/gif" && !autoPlayGif))}/>
            <span className="sharedEntityInfo">
                <span className="sharedEntityName">{stock ? t(stock.labelKey) : t("backgroundLibrary.customWallpaper")}</span>
                <span className="sharedEntityDetails">{busy ? t("backgroundLibrary.uploadSaving") : t(stock ? "backgroundLibrary.catalog" : "backgroundLibrary.shareImport")}</span>
            </span>
        </button>
    </div>;
}
