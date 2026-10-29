import { useUser } from "../../hooks/UserHook";
import { BookmarkSimpleIcon, CaretRightIcon, GearIcon, NewspaperIcon, SneakerMoveIcon, SignOutIcon, UserIcon, CheckIcon, CalendarCheckIcon, ChatTeardropIcon } from "@phosphor-icons/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSideMenu } from "../../hooks/SideMenuHook";
import { useTranslation } from "react-i18next";
import SearchedButts from "../../../pages/Settings/components/Search/SearchedButts";
import type { SearchableSetting } from "../../../pages/Settings/Settings";
import useLocalStorage from "../../hooks/utils/useLocalStorage";
import { Megaphone } from "lucide-react";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useNote } from "../../hooks/NoteHook";

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
    const [logoutConfirm, setLogoutConfirm] = useState(false);
    const logoutRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const outside = (event: PointerEvent) => {
            if (!logoutRef.current?.contains(event.target as Node)) setLogoutConfirm(false);
        };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, []);

    useEffect(() => { setLogoutConfirm(false); }, [activeTab]);

    const selectSetting = (sectionId: string, item: SearchableSetting) => {
        setRecentIds(previous => [item.id, ...previous.filter(id => id !== item.id)].slice(0, 5));
        navigate(item.id === "language" ? "/settings/language" : `/settings/${sectionId}`, {
            state: { settingId: item.id, settingName: item.name, from: "/settings" }
        });
        closeMenu();
    };

    if (activeTab === "user" && search.trim()) {
        return <div className="accountList SMlist accountSettingsSearch"><SearchedButts search={search} selectSetting={selectSetting}/></div>;
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
                    <span className="SMmainButtName"><SneakerMoveIcon weight="fill" size={30} className="SMmainButtSvg"/>{t("accountNavigation.activities")}<CaretRightIcon className="fastButtCaret"/></span>
                    <div className="SMmainButtDesc">{t("accountNavigation.activitiesDesc")}</div>
                </Link>
                <Link to="/settings" className={`SMaccountButt ${location.pathname.startsWith("/settings") ? "active" : ""}`} onClick={closeMenu}>
                    <span className="settingName"><GearIcon size={21} weight="fill"/>{t("accountNavigation.settings")}</span><CaretRightIcon className="fastButtCaret"/>
                </Link>
                <Link to={`/chat/${user.nick}`} className="SMaccountButt" onClick={closeMenu}>
                    <span className="settingName"><BookmarkSimpleIcon weight="fill"/>{t("accountNavigation.saved")}</span><CaretRightIcon className="fastButtCaret"/>
                </Link>
                <div className="SMcreateDiv">
                    <div className="SMcreateButt" onClick={() => setBlackout({ seted: true, module: "CreateChat" })}>
                        <ChatTeardropIcon size={18} weight="fill"/> Новый чат
                    </div>                    
                    <div className="SMcreateButt" onClick={() => setBlackout({seted: true, module: "AddHabit"})}>
                        <CalendarCheckIcon size={18} weight="fill"/> Новая активность
                    </div>                    
                    <div className="SMcreateButt" onClick={() => showNotification("info", "В разработке")}>
                        <Megaphone size={18} fill="currentColor"/> Новый спот
                    </div>
                </div>
                <button type="button" className="SMaccountButt logout" onClick={() => logoutConfirm ? logOut() : setLogoutConfirm(true)} ref={logoutRef}>
                    <span className="settingName">{logoutConfirm ? <CheckIcon size={21}/> : <SignOutIcon weight="fill" size={21}/>} {t(logoutConfirm ? "accountNavigation.confirmLogout" : "accountNavigation.logout")}</span>
                </button>
            </div>
        </div>
    );
}
