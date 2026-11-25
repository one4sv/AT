import { useUser } from "../../hooks/UserHook";
import { BookmarkSimpleIcon, CaretRightIcon, GearIcon, NewspaperIcon, SneakerMoveIcon, CalendarPlusIcon, SignOutIcon, UserIcon, CheckIcon, CalendarCheckIcon, ChatTeardropIcon, PencilSimpleIcon, TargetIcon, CaretDownIcon } from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSideMenu } from "../../hooks/SideMenuHook";
import { useTranslation } from "react-i18next";

import type { SearchableSetting } from "../../../pages/Settings/Settings";
import useLocalStorage from "../../hooks/utils/useLocalStorage";
import { Megaphone } from "lucide-react";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useNote } from "../../hooks/NoteHook";

const SearchedButts = lazy(() => import("../../../pages/Settings/components/Search/SearchedButts"));

const EMPTY_RECENT: string[] = [];

export default function AccountList() {
    const { logOut, user } = useUser();
    const { showNotification } = useNote()
    const { activeTab, closeMenu, settingsSearch: search } = useSideMenu();
    const { setBlackout } = useBlackout()
    const { t } = useTranslation("common");
    const location = useLocation();
    const navigate = useNavigate();
    const [, setRecentIds] = useLocalStorage<string[]>("settings_recent", EMPTY_RECENT);
    const [createExpanded,setCreateExpanded] = useState(false);
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const logoutRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const outside = (event: PointerEvent) => {
            if (!logoutRef.current?.contains(event.target as Node)) setLogoutConfirm(false);
        };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, []);

    useEffect(() => { setLogoutConfirm(false); setCreateExpanded(false); }, [activeTab]);

    const selectSetting = (sectionId: string, item: SearchableSetting) => {
        setRecentIds(previous => [item.id, ...previous.filter(id => id !== item.id)].slice(0, 5));
        navigate(item.id === "bg" ? "/wallpapers" : item.id === "language" ? "/settings/language" : `/settings/${sectionId}`, {
            state: { settingId: item.id, settingName: item.name, from: "/settings" }
        });
        closeMenu();
    };

    const openCreate = (module:string) => setBlackout({seted:true,module});

    if (activeTab === "user" && search.trim()) {
        return <div className="accountList SMlist accountSettingsSearch"><Suspense fallback={<div className="skeletonLine" role="status" aria-label={t("sideMenu.loading")}/>}><SearchedButts search={search} selectSetting={selectSetting} staticResults/></Suspense></div>;
    }

    return (
        <div className="accountList SMlist">
            <Link to={`/acc/${user.nick}`} className={`SMaccount ${location.pathname === `/acc/${user.nick}` ? "active" : ""}`} onClick={closeMenu}>
                <div className="SMAvatar">
                    {user.avatar_url ? <img src={user.avatar_url} alt=""/> : <UserIcon size={28} weight="fill"/>}
                </div>
                <div className="SMaccDesc">
                    <span className="SMname">
                        <span className="settingUserName">{user.username || user.nick}</span>
                        {user.username && <span className="settingUserNick"> | {user.nick}</span>}
                    </span>
                    <div className="SMaccDescText">{user.mail}</div>
                </div>
            </Link>
            <div className="SMaccountButtsWrapper">
                <Link to="/" className={`SMmainButt ${location.pathname === "/" ? "active" : ""}`} onClick={closeMenu}>
                    <span className="SMmainButtName"><NewspaperIcon weight="fill" size={30} className="SMmainButtSvg"/>{t("accountNavigation.feed")}<CaretRightIcon className="fastButtCaret"/></span>
                    <div className="SMmainButtDesc">{t("accountNavigation.feedDesc")}</div>
                </Link>
                <Link to="/habit" className={`SMmainButt ${location.pathname === "/habit" ? "active" : ""}`} onClick={closeMenu}>
                    <span className="SMmainButtName"><SneakerMoveIcon weight="fill" size={30} className="SMmainButtSvg"/>{t("sideMenu.plansAndActivities")}<CaretRightIcon className="fastButtCaret"/></span>
                    <div className="SMmainButtDesc">{t("accountNavigation.activitiesDesc")}</div>
                </Link>
                <Link to="/settings" className={`SMaccountButt ${location.pathname.startsWith("/settings") ? "active" : ""}`} onClick={closeMenu}>
                    <span className="settingName"><GearIcon size={21} weight="fill"/>{t("accountNavigation.settings")}</span><CaretRightIcon className="fastButtCaret"/>
                </Link>
                <Link to={`/chat/${user.nick}`} className="SMaccountButt" onClick={closeMenu}>
                    <span className="settingName"><BookmarkSimpleIcon weight="fill"/>{t("accountNavigation.saved")}</span><CaretRightIcon className="fastButtCaret"/>
                </Link>
                <div className="SMcreateDiv">
                    <div className="SMcreateButt" onClick={() => { closeMenu(); navigate("/post/new"); }}>
                        <PencilSimpleIcon size={18} weight="fill"/> {t("sideMenu.newPost")}
                    </div>
                    <div className="SMcreateButt" onClick={() => openCreate("CreateChat")}>
                        <ChatTeardropIcon size={18} weight="fill"/> {t("sideMenu.newChat")}
                    </div>                    
                    <div className="SMcreateButt" onClick={() => openCreate("AddHabit")}>
                        <CalendarCheckIcon size={18} weight="fill"/> {t("sideMenu.newActivity")}
                    </div>
                    {createExpanded && <>
                    <div className="SMcreateButt" onClick={() => openCreate("AddPlan")}>
                        <CalendarPlusIcon size={18} weight="fill"/> {t("plans.create")}
                    </div>                    
                    <div className="SMcreateButt" onClick={() => openCreate("AddGoal")}>
                        <TargetIcon size={18} weight="fill"/> {t("sideMenu.newGoal")}
                    </div>
                    <div className="SMcreateButt" onClick={() => showNotification("info", t("sideMenu.inDevelopment"))}>
                        <Megaphone size={18} fill="currentColor"/> {t("sideMenu.newSpot")}
                    </div>
                    </>}
                    <button type="button" className="SMcreateButt SMcreateMore" aria-expanded={createExpanded} onClick={()=>setCreateExpanded(value=>!value)}>
                        <CaretDownIcon size={18} className={createExpanded?"expanded":""}/>{t(createExpanded?"sideMenu.createLess":"sideMenu.globalSearchMore")}
                    </button>
                </div>
                <button type="button" className="SMaccountButt logout" onClick={() => logoutConfirm ? logOut() : setLogoutConfirm(true)} ref={logoutRef}>
                    <span className="settingName">{logoutConfirm ? <CheckIcon size={21}/> : <SignOutIcon weight="fill" size={21}/>} {t(logoutConfirm ? "accountNavigation.confirmLogout" : "accountNavigation.logout")}</span>
                </button>
            </div>
        </div>
    );
}
