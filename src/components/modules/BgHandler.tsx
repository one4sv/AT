import { useEffect, useState } from "react";
import "../../scss/modules/BackgroundHandler.scss";
import { useBlackout } from "../hooks/BlackoutHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useNote } from "../hooks/NoteHook";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import getCroppedImg from "../ts/utils/cropImage";
import SeekBar from "../../pages/Settings/components/SeekBar";

export const BgHandler = () => {
    const { blackout, setBlackout } = useBlackout();
    const { setNewBg, setBgUrl } = useUpSettings();
    const { showNotification } = useNote();
    const [ crop, setCrop ] = useState({ x: 0, y: 0 });
    const [ zoom, setZoom ] = useState(1);
    const [ croppedAreaPixels, setCroppedAreaPixels ] = useState<Area | null>(null);
    const [ previewUrl, setPreviewUrl ] = useState("");
    const [ saving, setSaving ] = useState(false);

    useEffect(() => {
        if (!blackout.bg) return;
        const url = URL.createObjectURL(blackout.bg);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [blackout.bg]);

    const cropImageHandler = async () => {
        if (!blackout.bg || !croppedAreaPixels || saving) return;
        setSaving(true);
        try {
            const croppedFile = await getCroppedImg(blackout.bg, croppedAreaPixels);
            const saved = await setBgUrl(croppedFile);
            if (!saved) {
                showNotification("error", "Не удалось сохранить фон");
                return;
            }
            setNewBg("custom");
            setBlackout({ seted: false });
        } catch {
            showNotification("error", "Не удалось обработать фон");
        } finally {
            setSaving(false);
        }
    };

    return <div className="backgroundHandlerDiv" role="dialog" aria-modal="true" aria-label="Редактировать фон">
        <div className="backgroundHandlerTitle">Редактировать фон</div>
        <div className="backgroundHandlerImg">
            {previewUrl && <div className="cropContainer">
                <Cropper image={previewUrl} crop={crop} zoom={zoom} aspect={16 / 9}
                    cropShape="rect" showGrid={true}
                    onCropChange={setCrop} onZoomChange={setZoom}
                    onCropComplete={(_, area) => setCroppedAreaPixels(area)}/>
            </div>}
        </div>
        <div className="backgroundHandlerControls">
            <div className="backgroundHandlerZoom">
                <label>Масштаб</label>
                <SeekBar id="backgroundZoom" min={1} max={3} step={.1} value={zoom} unit="×"
                    disabled={saving} onChange={setZoom}/>
            </div>
        </div>
        <div className="backgroundHandlerButts">
            <button type="button" className="backgroundHandlerCancel" disabled={saving}
                onClick={() => setBlackout({ seted: false })}>Отмена</button>
            <button type="button" className="backgroundHandlerConfirm" disabled={saving || !croppedAreaPixels}
                onClick={() => void cropImageHandler()}>{saving ? "Сохранение…" : "Сохранить фон"}</button>
        </div>
    </div>;
};
