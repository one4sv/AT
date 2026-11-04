import { BellRingingIcon, ChatsTeardropIcon, GearIcon, MoonStarsIcon, PaintBucketIcon, SunIcon, TranslateIcon, ImageIcon, LockKeyIcon, ShieldCheckIcon, EyeIcon, UsersIcon, UserCircleIcon, CookieIcon } from "@phosphor-icons/react";
import { MirrorRectangular } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useSettings } from "../../../hooks/SettingsHook";
import { useUpSettings } from "../../../hooks/UpdateSettingsHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import Toggler from "../../Toggler";

export default function SettingsSectionMenu() {
    const { t } = useTranslation("settings");
    const { menu, closeMenu } = useContextMenu();
    const { isDark, decor, note, messNote } = useSettings();
    const { setNewTheme, setNewDecor, setNewNote, setNewMessNote } = useUpSettings();
    const { setBlackout } = useBlackout();
    const navigate = useNavigate();
    const section = menu.options.id;

    const openSection = (id: string, settingId?: string) => {
        closeMenu();
        navigate(`/settings/${id}`, settingId ? { state: { settingId } } : undefined);
    };

    return (
        <>
            {section === "gen" && <div className="ContextMenuButt" onClick={() => {
                closeMenu();
                navigate("/settings/language", { state: { from: "/settings/gen" } });
            }}><TranslateIcon/>{t("general.language")}</div>}

            {section === "pers" && <>
                <div className="ContextMenuButt" onClick={() => {
                    setNewTheme(isDark ? "light" : "dark");
                    closeMenu();
                }}>{isDark ? <MoonStarsIcon weight="fill"/> : <SunIcon weight="fill"/>}
                    {t("personalization.theme")}: {isDark ? t("personalization.dark") : t("personalization.light")}
                </div>
                <div className="ContextMenuButt" onClick={() => {
                    setNewDecor(decor === "glass" ? "default" : "glass");
                    closeMenu();
                }}><MirrorRectangular/>
                    {t("personalization.decor")}: {decor === "glass" ? t("personalization.glass") : t("personalization.default")}
                </div>
                <div className="ContextMenuButt" onClick={() => {
                    closeMenu();
                    setBlackout({ seted: true, module: "BackgroundLibrary" });
                }}><ImageIcon/>{t("personalization.background")}</div>
            </>}

            {section === "notes" && <>
                <div className="ContextMenuButt" onClick={() => {
                    setNewNote(!note);
                    closeMenu();
                }}><BellRingingIcon/>{t("notifications.generalNotifications")}<Toggler state={note}/></div>
                <div className="ContextMenuButt" onClick={() => {
                    setNewMessNote(!messNote);
                    closeMenu();
                }}><ChatsTeardropIcon/>{t("notifications.newMessages")}<Toggler state={messNote}/></div>
            </>}

            {section === "activities" && <div className="ContextMenuButt" onClick={() => openSection("activities")}>
                <PaintBucketIcon/>{t("settings.activities")}
            </div>}

            {section === "security" && <>
                <div className="ContextMenuButt" onClick={() => {
                    closeMenu();
                    navigate("/settings/password");
                }}><LockKeyIcon/>{t("security.changePassword")}</div>
                <div className="ContextMenuButt" onClick={() => {
                    closeMenu();
                    navigate("/settings/devices");
                }}><ShieldCheckIcon/>{t("security.devices")}</div>
            </>}

            {section === "chats" && <div className="ContextMenuButt" onClick={() => openSection("chats", "chatWelcome")}>
                <ChatsTeardropIcon/>{t("settings.chats")}
            </div>}
            {section === "privacy" && <>
                <div className="ContextMenuButt" onClick={() => openSection("privacy", "privacyAccountInfo")}>
                    <UserCircleIcon/>{t("privacy.accountInfo")}
                </div>
                <div className="ContextMenuButt" onClick={() => openSection("privacy", "privacyContentVisibility")}>
                    <EyeIcon/>{t("privacy.contentVisibility")}
                </div>
                <div className="ContextMenuButt" onClick={() => openSection("privacy", "privacyActivityInvites")}>
                    <ShieldCheckIcon/>{t("privacy.exceptions.activityTitle")}
                </div>
                <div className="ContextMenuButt" onClick={() => openSection("privacy", "activityInviteExceptions")}>
                    <UsersIcon/>{t("privacy.exceptions.activityExceptions")}
                </div>
                <div className="ContextMenuButt" onClick={() => openSection("privacy", "groupInvites")}>
                    <LockKeyIcon/>{t("privacy.invites.title")}
                </div>
                <div className="ContextMenuButt" onClick={() => openSection("privacy", "groupInviteExceptions")}>
                    <UsersIcon/>{t("privacy.exceptions.groupExceptions")}
                </div>
                <div className="ContextMenuButt" onClick={() => openSection("privacy", "cookieConsent")}>
                    <CookieIcon/>{t("privacy.manageCookies")}
                </div>
            </>}
            {section === "acc" && <div className="ContextMenuButt" onClick={() => openSection("acc")}>
                <GearIcon/>{t("settings.account")}
            </div>}
            {section === "info" && <div className="ContextMenuButt" onClick={() => {
                closeMenu();
                navigate("/info");
            }}><GearIcon/>{t("settings.info")}</div>}
        </>
    );
}
