import { ChatTeardropIcon, CopyIcon, UserIcon } from "@phosphor-icons/react";
import "../../scss/modules/ShareAccDiv.scss"
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { QRCodeSVG } from "qrcode.react";

export default function ShareAcc() {
    const { blackout } = useBlackout()
    const { showNotification } = useNote()

    const link = window.location.origin + `/acc/${blackout.options?.nick}`
    const photo = blackout.options?.url
    
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(link)
            showNotification("success", "Ссылка скопирована")
        } catch {
            showNotification("error", "Не удалось скопировать ссылку")
        }
    }

    return (
        <div className="shareAccDiv">
            <div className="moduleName">
                Поделиться аккаунтом
            </div>
            <div className="settingInnerList">
                <div className="settingInnerButt" onClick={copyLink}>
                    <CopyIcon weight="fill"/> Скопировать ссылку
                </div>
                <div className="settingInnerButt" onClick={() => showNotification("info", "В разработке")}>
                    <ChatTeardropIcon weight="fill"/> Отправить в чат
                </div>
            </div>
            <div className="moduleName">
                QR - код
            </div>
            <div className="qrCodeWrap">
                <svg className="qrGradientDefs" aria-hidden="true">
                    <defs>
                        <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent)"/>
                            <stop offset="100%" stopColor="var(--grad)"/>
                        </linearGradient>
                    </defs>
                </svg>
                <QRCodeSVG
                    value={link}
                    size={256}
                    level="H"
                    bgColor="transparent"
                    fgColor="url(#qrGradient)"
                />
                <div className="qrCodePhoto">
                    {photo ? (
                        <img src={photo} alt=""/>
                    ) : (
                        <UserIcon weight="fill"/>
                    )}
                </div>
            </div>
        </div>
    )
}