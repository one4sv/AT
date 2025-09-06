import { useState } from "react";
import "../../scss/modules/BackgroundHandler.scss";
import { useBlackout } from "../hooks/BlackoutHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import getCroppedImg from "../ts/utils/cropImage";

export const BgHandler = () => {
  const { blackout, setBlackout } = useBlackout();
  const { setNewBg, setBgUrl } = useUpSettings();

  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [blur, setBlur] = useState<number>(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = (_: Area, croppedArea: Area) => {
    setCroppedAreaPixels(croppedArea);
  };

  const cropImageHandler = async () => {
    if (!blackout.bg || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImg(blackout.bg, croppedAreaPixels, blur);
      setNewBg("custom");
      setBgUrl(croppedFile);

      setBlackout({ seted: false });
    } catch (err) {
      console.error("Ошибка при кропе:", err);
    }
  };

  return (
    <div className="backgroundHandlerDiv">
      <div className="backgroundHandlerImg">
        {blackout.bg && (
          <div className="cropContainer">
            <img
              src={URL.createObjectURL(blackout.bg)}
              alt="preview"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: `blur(${blur}px)`,
                transform: `scale(${zoom})`,
                transformOrigin: "center",
                zIndex: 0,
              }}
            />
            <Cropper
              image={URL.createObjectURL(blackout.bg)}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { zIndex: 1, position: "relative" } }}
            />
          </div>
        )}
      </div>

      <div className="backgroundHandlerControls">
        <div className="backgroundHandlerBlur">
          <label htmlFor="blurRange">Размытие: {blur}px</label>
          <input
            type="range"
            id="blurRange"
            min={0}
            max={20}
            step={0.1}
            value={blur}
            onChange={(e) => setBlur(Number(e.target.value))}
          />
        </div>
        <div className="backgroundHandlerZoom">
          <label htmlFor="zoomRange">Масштаб: {zoom.toFixed(1)}x</label>
          <input
            type="range"
            id="zoomRange"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="backgroundHandlerButts">
        <button
          className="backgroundHandlerCancel"
          onClick={() => setBlackout({ seted: false })}
        >
          Отмена
        </button>
        <button className="backgroundHandlerConfirm" onClick={cropImageHandler}>
          Подтвердить
        </button>
      </div>
    </div>
  );
};
