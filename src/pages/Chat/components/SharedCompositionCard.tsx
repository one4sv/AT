import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useNote } from "../../../components/hooks/NoteHook";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { fetchWallpaperFile } from "../../../components/ts/utils/fetchWallpaperFile";
import type { Composition } from "../../../components/ts/utils/compositions";
import type { Media } from "../../../components/context/ChatContext";
import { CompositionPreview } from "../../Settings/components/CompositionsSettings";
import "../scss/SharedEntityCard.scss";

export default function SharedCompositionCard({ item, media }: { item: Composition; media?: Media }) {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const { autoLoadImages, autoPlayGif } = useSettings();
    const [busy, setBusy] = useState(false);
    const isCustom = item.appearance.bg === "custom";
    const preview = { ...item, appearance: { ...item.appearance, bgUrl: isCustom && autoLoadImages && (media?.type !== "image/gif" || autoPlayGif) ? media?.url ?? "" : "" } };
    const open = async () => {
        if (busy) return;
        if (!isCustom) {
            setBlackout({ seted: true, module: "CompositionFullscreen", sharedComposition: item });
            return;
        }
        if (!media) { showNotification("error", t("backgroundLibrary.shareNotFound")); return; }
        setBusy(true);
        try {
            const file = await fetchWallpaperFile(media.url, "media");
            setBlackout({ seted: true, module: "CompositionFullscreen", sharedComposition: item, bg: file });
        } catch { showNotification("error", t("backgroundLibrary.shareNotFound")); }
        finally { setBusy(false); }
    };
    return <div className="sharedEntityCard sharedWallpaperCard" onDoubleClick={event => event.stopPropagation()}>
        <button type="button" className="sharedEntityLink" disabled={busy} aria-busy={busy}
            onClick={event => { event.stopPropagation(); void open(); }}>
            <span className="compositionContextPreview wallpaperShareThumbnail"><CompositionPreview composition={preview}/></span>
            <span className="sharedEntityInfo">
                <span className="sharedEntityName">{item.name}</span>
                <span className="sharedEntityDetails">{t("personalization.compositions.title")}</span>
            </span>
        </button>
    </div>;
}
