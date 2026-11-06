import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, RectangleHorizontal, RectangleVertical, Square, Maximize, RotateCcw } from "lucide-react";
import "../../scss/modules/BackgroundHandler.scss";
import { useBlackout } from "../hooks/BlackoutHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useNote } from "../hooks/NoteHook";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import getCroppedImg from "../ts/utils/cropImage";
import SeekBar from "../../pages/Settings/components/SeekBar";
import { MAX_CUSTOM_BACKGROUNDS } from "../ts/utils/backgroundCatalog";
import { useSettings } from "../hooks/SettingsHook";

type Ratio = "free" | "portrait" | "landscape" | "square";

export const BgHandler = () => {
    const { t } = useTranslation("settings");
    const { bgGallery } = useSettings();
    const { blackout, setBlackout } = useBlackout();
    const { setNewBg, setBgUrl } = useUpSettings();
    const { showNotification } = useNote();
    const [ crop, setCrop ] = useState({ x: 0, y: 0 });
    const [ zoom, setZoom ] = useState(1);
    const [ ratio, setRatio ] = useState<Ratio>("portrait");
    const [ naturalRatio, setNaturalRatio ] = useState(1);
    const [ croppedAreaPixels, setCroppedAreaPixels ] = useState<Area | null>(null);
    const [ previewUrl, setPreviewUrl ] = useState("");
    const [ saving, setSaving ] = useState(false);
    const file = blackout.bg;
    const maxSize = 25 * 1024 * 1024;
    const valid = file && file.size <= maxSize && /^image\/(jpeg|png|webp|gif|avif)$/.test(file.type);
    const aspect = ratio === "portrait" ? 9 / 16 : ratio === "landscape" ? 16 / 9 : ratio === "square" ? 1 : naturalRatio;

    useEffect(() => {
        if (!file || !valid) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        const image = new Image();
        image.onload = () => setNaturalRatio(image.naturalWidth / image.naturalHeight);
        image.src = url;
        return () => URL.revokeObjectURL(url);
    }, [file, valid]);

    const reset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    };

    const cropImageHandler = async () => {
        if (!file || !valid || !croppedAreaPixels || saving || bgGallery.length >= MAX_CUSTOM_BACKGROUNDS) return;
        setSaving(true);
        try {
            const croppedFile = await getCroppedImg(file, croppedAreaPixels);
            const saved = await setBgUrl(croppedFile);
            if (!saved) return;
            setNewBg("custom");
            setBlackout({ seted: false });
        } catch {
            showNotification("error", t("backgroundLibrary.uploadProcessingError"));
        } finally {
            setSaving(false);
        }
    };

    const ratios: { id: Ratio; icon: typeof ImageIcon; key: string }[] = [
        { id: "free", icon: Maximize, key: "uploadOriginal" },
        { id: "portrait", icon: RectangleVertical, key: "uploadPortrait" },
        { id: "landscape", icon: RectangleHorizontal, key: "uploadLandscape" },
        { id: "square", icon: Square, key: "uploadSquare" }
    ];

    return <div className="backgroundHandlerDiv" role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.uploadTitle")}>
        <div className="backgroundHandlerTitle">{t("backgroundLibrary.uploadTitle")}</div>
        {valid ? <>
            <div className="backgroundHandlerImg" style={{ aspectRatio: ratio === "portrait" ? "9 / 12" : "16 / 9" }}>
                {previewUrl && <div className="cropContainer">
                    <Cropper image={previewUrl} crop={crop} zoom={zoom} aspect={aspect}
                        cropShape="rect" showGrid={true}
                        onCropChange={setCrop} onZoomChange={setZoom}
                        onCropComplete={(_, area) => setCroppedAreaPixels(area)}/>
                </div>}
            </div>
            <div className="backgroundHandlerRatio" role="group" aria-label={t("backgroundLibrary.uploadRatio")}>
                {ratios.map(item => {
                    const Icon = item.icon;
                    return <button type="button" key={item.id} className={ratio === item.id ? "active" : ""}
                        aria-pressed={ratio === item.id} disabled={saving}
                        onClick={() => { setRatio(item.id); reset(); }}>
                        <Icon size={19}/>
                        <span>{t("backgroundLibrary." + item.key)}</span>
                    </button>;
                })}
            </div>
            <div className="backgroundHandlerControls">
                <div className="backgroundHandlerZoom">
                    <label>{t("backgroundLibrary.uploadZoom")}</label>
                    <SeekBar id="backgroundZoom" min={1} max={3} step={.05} value={zoom} unit="×"
                        disabled={saving} onChange={setZoom}/>
                </div>
                <button type="button" className="backgroundHandlerReset" disabled={saving} onClick={reset}>
                    <RotateCcw size={17}/>{t("backgroundLibrary.uploadReset")}
                </button>
                <div className="backgroundHandlerHint">{t("backgroundLibrary.uploadHint")}</div>
                {file?.type === "image/gif" && <div className="backgroundHandlerHint">{t("backgroundLibrary.uploadGifHint")}</div>}
            </div>
        </> : <div className="backgroundHandlerHint">{t("backgroundLibrary.uploadInvalid")}</div>}
        {bgGallery.length >= MAX_CUSTOM_BACKGROUNDS && <div className="backgroundHandlerHint">{t("backgroundLibrary.limit")}</div>}
        <div className="backgroundHandlerButts">
            <button type="button" className="backgroundHandlerCancel" disabled={saving}
                onClick={() => setBlackout({ seted: false })}>{t("backgroundLibrary.uploadCancel")}</button>
            <button type="button" className="backgroundHandlerConfirm" disabled={saving || !valid || !croppedAreaPixels || bgGallery.length >= MAX_CUSTOM_BACKGROUNDS}
                onClick={() => void cropImageHandler()}>{saving ? t("backgroundLibrary.uploadSaving") : t("backgroundLibrary.uploadSave")}</button>
        </div>
    </div>;
};
