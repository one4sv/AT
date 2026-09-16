import { useUser } from "../../hooks/UserHook"
import { api } from "../api"
import { LogOutIcon } from "lucide-react";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { useNote } from "../../hooks/NoteHook";
import { BookmarkSimpleIcon, CaretRightIcon, GearIcon, UserIcon } from "@phosphor-icons/react";
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
    console.log(location.pathname)
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
                                <span className="settingUserNick">| @{user.nick}</span>
                            </>
                        ) : (
                            <>@{user.nick}</>
                        )}
                    </span>
                        <div className="SMaccDescText">
                            {location.pathname === `/acc/${user.nick}` ? (
                                "Мой профиль"
                            ) : (
                                <>
                                    Перейти в профиль
                                    <CaretRightIcon />
                                </>
                            )}
                        </div>
                </div>
            </div>
            <div className="SMaccountButtsWrapper">
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
                        <LogOutIcon size={21}/> Выйти из аккаунта
                    </span>
                </div>
            </div>
        </div>
    )
}