import { Link } from "react-router"
import { useUser } from "../../hooks/UserHook"
import { Calendar, CircleUserRound, House } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function SMnav({closeMenu}:{closeMenu:()=>void}) {
    const { t } = useTranslation("common")
    const { user } = useUser()
    const active = location.pathname === "/"
        ? "home"
        : location.pathname.includes("/settings") 
            ? "user" 
            : location.pathname === ("/habit") || location.pathname === ("/habit/") 
                ? "habits" 
                : ""
    return (
        <div className="SMnavDiv">
            <div className="SMnav">
                {active !== "" ?
                    <div className="SMnavActive"
                        style={{
                            left:active === "home" 
                                ? "0" 
                                : active === "user"
                                    ? `${100 / 3}%`
                                    : active === "habits"
                                        ?  `${100 / 3 * 2}%`
                                        :""
                        }}
                    />
                : ""}
                
                <Link className={`SMnavButt ${active === "home" ? "active" : ""}`} to={"/"} onClick={() => {
                    if (active === "home") closeMenu()
                }}>
                    <House />
                    <span>{t("sideMenu.home")}</span>
                </Link>
                <Link
                    className={`SMnavButt SMnavAvatar ${active === "user" ? "active" : ""}`}
                    onClick={() => {
                        if (active === "user") closeMenu()
                    }}
                    to={"/settings"}
                >
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.username ?? user.nick ?? "фото"}
                        />
                    ) : (
                        <CircleUserRound />
                    )}
                    <span>{user.nick}</span>
                </Link>
                <Link className={`SMnavButt ${active === "habits" ? "active" : ""}`} to={"/habit"} onClick={() => {
                    if (active === "habits") closeMenu()
                }}>
                    <Calendar />
                    <span>{t("sideMenu.activities")}</span>
                </Link>
            </div>
        </div>

    )
}