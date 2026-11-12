
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChatTeardropIcon, CopyIcon, UserIcon, UsersIcon } from "@phosphor-icons/react";
import "./scss/ShareAccDiv.scss"
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { QRCodeSVG } from "qrcode.react";
import { useSettings } from "../hooks/SettingsHook";
import { useUser } from "../hooks/UserHook";

export default function ShareAcc() {
    const { t } = useTranslation("common");
    const { blackout } = useBlackout()
    const { showNotification } = useNote()
    const { privateShow, profileShareToken } = useSettings();
    const { user } = useUser();
    const nick = blackout.options?.nick
    const isGroup = Boolean(blackout.options?.link)
    const accountUrl = new URL("/acc/" + encodeURIComponent(nick || ""),window.location.origin);
    const existingShare = new URLSearchParams(window.location.search).get("share");
    if (!blackout.options?.link && nick === user.nick && profileShareToken &&
        [privateShow.profile,privateShow.habits,privateShow.posts,privateShow.plans].includes("link"))
        accountUrl.searchParams.set("share",profileShareToken);
    else if (!blackout.options?.link && existingShare) accountUrl.searchParams.set("share",existingShare);
    const link = blackout.options?.link || accountUrl.href;
    const photo = blackout.options?.url

    const qr = useMemo(() => (
        <QRCodeSVG
            value={link}
            size={256}
            level="H"
            bgColor="transparent"
            fgColor="url(#qrGradient)"
        />
    ), [link])

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(link)
            showNotification("success", t("links.copied"))
        } catch {
            showNotification("error", t("links.copyFailed"))
        }
    }

    return (
        <div className="shareAccDiv">
            <div className="moduleName">
                {t(isGroup ? "share.group" : "share.account")}
            </div>
            <div className="settingInnerList">
                <div className="settingInnerButt" onClick={copyLink}>
                    <CopyIcon weight="fill"/> {t("links.copy")}
                </div>
                {!isGroup && <div className="settingInnerButt" onClick={() => showNotification("info", t("sideMenu.inDevelopment"))}>
                    <ChatTeardropIcon weight="fill"/> {t("share.sendToChat")}
                </div>}
            </div>
            <div className="moduleName">
                {t("share.qrCode")}
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
                {qr}
                <div className="qrCodePhoto">
                    {photo ? (
                        <img src={photo} alt=""/>
                    ) : (
                        isGroup ? <UsersIcon weight="fill"/> : <UserIcon weight="fill"/>
                    )}
                </div>
            </div>
        </div>
    )
}
