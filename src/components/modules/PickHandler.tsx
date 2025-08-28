import { useState } from "react"
import "../../scss/modules/PickHandler.scss"
import { useBlackout } from "../hooks/BlackoutHook"
import { useUpUser } from "../hooks/UpdateUserHook"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import getCroppedImg from "../ts/utils/cropImage"

export const PickHandler = () => {
    const { blackout, setBlackout } = useBlackout()
    const { setNewPick } = useUpUser()

    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    const cropImageHandler = async () => {
        if (!blackout.pick || !croppedAreaPixels) return
        const croppedFile = await getCroppedImg(blackout.pick, croppedAreaPixels)
        setNewPick(croppedFile)
        setBlackout({ seted: false })
    }

    return (
        <div className="pickHandlerDiv">
            <div className="pickHandlerImg">
                {blackout.pick && (
                    <div className="cropContainer">
                        <Cropper
                            image={URL.createObjectURL(blackout.pick)}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="rect"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                        <div className="circleMask"></div>
                    </div>
                )}
            </div>
            <div className="pickHandlerButts">
                <button className="pickHandlerCancel" onClick={() => setBlackout({ seted: false })}>
                    Отмена
                </button>
                <button className="pickHandlerConfirm" onClick={cropImageHandler}>
                    Подтвердить
                </button>
            </div>
        </div>
    )
}
