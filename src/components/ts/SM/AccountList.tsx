import { useUser } from "../../hooks/UserHook"
import { api } from "../api"
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { useNote } from "../../hooks/NoteHook";
import { BookmarkSimpleIcon, CaretRightIcon, GearIcon, NewspaperIcon, PersonSimpleRunIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";

export default function AccountList() {
    const { t } = useTranslation("settings");
    const { refetchUser, user } = useUser()
    const { showNotification } = useNote()

    const navigate = useNavigate()

    const logOut = async () => {
        try {
            const res = await api.get(`logout`)
            if (res.data.success) {
                refetchUser()
            } else {
                showNotification("error", t("sideMenu.logOutError"))
            }
        } catch (error: unknown) {
            if (isAxiosError(error)) {
                showNotification("error", error.response?.data?.messages || t("sideMenu.logOutError"))
            } else {
                showNotification("error", t("sideMenu.logOutErrorGeneric"))
            }
        }
    }

    return (
        <div className="accountList SMlist">
            <div
                className={`SMaccount ${location.pathname === `/acc/${user.nick}` ? "active" : "" }`}
                onClick={() => {
                    navigate(`/acc/${user.nick}`);
                }}
            >
                {user.avatar_url ? (
                    <div className="SMAvatar">
                        <img src={user.avatar_url} alt="" />
                    </div>
                ) : (
                    <div className="SMAvatar">
                        <UserIcon size={28} weight="fill" />
                    </div>
                )}
                <div className="SMaccDesc">
                    <span className="SMname">
                        {user.username ? (
                            <>
                                <span className="settingUserName">{user.username}</span>{" "}
                                <span className="settingUserNick">| {user.nick}</span>
                            </>
                        ) : (
                            <>{user.nick}</>
                        )}
                    </span>
                    <div className="SMaccDescText">
                        {user.mail}
                    </div>
                </div>
            </div>
            <div className="SMaccountButtsWrapper">
                <div className={`SMmainButt ${location.pathname === "/" ? "active" : ""}`} onClick={() => navigate("/")}>
                    <span className="SMmainButtName">
                        <NewspaperIcon weight="fill" size={30} className="SMmainButtSvg"/> Лента <CaretRightIcon className="fastButtCaret"/>
                    </span>
                    <div className="SMmainButtDesc">Просматривайте единую лену постов из спотов и от друзей, рекомендации, ближайшие активности и планы друзей</div>
                </div>
                <div className={`SMmainButt ${location.pathname === "/habit" ? "active" : ""}`} onClick={() => navigate("/habit")}>
                    <span className="SMmainButtName">
                        <PersonSimpleRunIcon weight="fill" size={30} className="SMmainButtSvg"/> Активности <CaretRightIcon className="fastButtCaret"/>
                    </span>
                    <div className="SMmainButtDesc">Следите за активностями, стройте планы, отметьте достижения и проверьте календарь</div>
                </div>
                <div className={`SMaccountButt ${location.pathname === "/settings" ? "active" : "" }`} onClick={() => navigate("/settings")}>
                    <span className="settingName">
                        <GearIcon size={21} weight="fill"/> 
                        Настройки
                    </span>
                        <CaretRightIcon className="fastButtCaret"/>
                </div>
                <div className="SMaccountButt" onClick={() => showNotification("info", "В разработке")}>
                    <span className="settingName">
                        <BookmarkSimpleIcon weight="fill"/> 
                        Перейти в избранное
                    </span>
                    <CaretRightIcon className="fastButtCaret"/>
                </div>
                <div className="SMaccountButt logout" onClick={() => logOut()}>
                    <span className="settingName">
                        <SignOutIcon weight="fill" size={21}/> Выйти из аккаунта
                    </span>
                </div>
            </div>
        </div>
    )
}