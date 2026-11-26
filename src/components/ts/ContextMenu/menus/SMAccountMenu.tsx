import { ArrowSquareOutIcon, CalendarCheckIcon, CalendarPlusIcon, GearIcon, LockKeyIcon, MagnifyingGlassIcon, PaintBucketIcon, PencilSimpleIcon, ShareFatIcon, TargetIcon, UserIcon } from "@phosphor-icons/react";
import { Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useSideMenu } from "../../../hooks/SideMenuHook";
import { useUser } from "../../../hooks/UserHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useNote } from "../../../hooks/NoteHook";

export default function SMAccountMenu() {
    const { t } = useTranslation(["common", "acc", "settings"]);
    const { menu, closeMenu } = useContextMenu();
    const { closeMenu: closeSM, setRed } = useSideMenu();
    const { user } = useUser();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const navigate = useNavigate();
    const id = menu.options.id;
    const go = (path: string, state?: object) => {
        closeMenu();
        closeSM();
        navigate(path, {state});
    };
    const create = (module: string) => {
        closeMenu();
        setBlackout({seted: true, module});
    };
    const profile = `/acc/${user.nick}`;
    const saved = `/chat/${user.nick}`;
    return <>
        {id === "profile" && <>
            <div className="ContextMenuButt" onClick={() => go(profile)}><UserIcon/>{t("accountNavigation.openProfile")}</div>
            <div className="ContextMenuButt" onClick={() => {go(profile, {editProfile: true}); setRed(true);}}><PencilSimpleIcon/>{t("edit", {ns: "acc"})}</div>
            <div className="ContextMenuButt" onClick={() => {
                closeMenu();
                setBlackout({seted:true, module:"ShareAcc", options:{name:user.username || "", nick:user.nick || "", url:user.avatar_url || ""}});
            }}><ShareFatIcon/>{t("share", {ns: "acc"})}</div>
        </>}
        {id === "feed" && <>
            <div className="ContextMenuButt" onClick={() => go("/")}><ArrowSquareOutIcon/>{t("accountNavigation.openSection")}</div>
            <div className="ContextMenuButt" onClick={() => go("/post/new")}><PencilSimpleIcon/>{t("sideMenu.newPost")}</div>
        </>}
        {id === "active" && <>
            <div className="ContextMenuButt" onClick={() => go("/habit")}><ArrowSquareOutIcon/>{t("accountNavigation.openSection")}</div>
            <div className="ContextMenuButt" onClick={() => create("AddHabit")}><CalendarCheckIcon/>{t("sideMenu.newActivity")}</div>
        </>}
        {(id === "active" || id === "more") && <>
            <div className="ContextMenuButt" onClick={() => create("AddPlan")}><CalendarPlusIcon/>{t("plans.create")}</div>
            <div className="ContextMenuButt" onClick={() => create("AddGoal")}><TargetIcon/>{t("sideMenu.newGoal")}</div>
        </>}
        {id === "more" && <div className="ContextMenuButt" onClick={() => {closeMenu(); showNotification("info", t("sideMenu.inDevelopment"));}}><Megaphone/>{t("sideMenu.newSpot")}</div>}
        {id === "settings" && <>
            <div className="ContextMenuButt" onClick={() => go("/settings")}><GearIcon/>{t("accountNavigation.openSection")}</div>
            <div className="ContextMenuButt" onClick={() => go("/settings/pers")}><PaintBucketIcon/>{t("settings.personalization", {ns:"settings"})}</div>
            <div className="ContextMenuButt" onClick={() => go("/settings/privacy")}><LockKeyIcon/>{t("settings.privacy", {ns:"settings"})}</div>
            <div className="ContextMenuButt" onClick={() => go("/settings/security")}><LockKeyIcon/>{t("settings.security", {ns:"settings"})}</div>
        </>}
        {id === "saved" && <>
            <div className="ContextMenuButt" onClick={() => go(saved)}><ArrowSquareOutIcon/>{t("accountNavigation.openSection")}</div>
            <div className="ContextMenuButt" onClick={() => go(saved, {openSavedSearch: true})}><MagnifyingGlassIcon/>{t("chatUi.searchMessages")}</div>
        </>}
    </>;
}
