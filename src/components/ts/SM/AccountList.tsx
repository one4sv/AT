import { useUser } from "../../hooks/UserHook"
import { BookmarkSimpleIcon, CaretRightIcon, GearIcon, NewspaperIcon, SneakerMoveIcon , SignOutIcon, UserIcon, CheckIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useSideMenu } from "../../hooks/SideMenuHook";

export default function AccountList() {
    const { logOut, user } = useUser()
    const { activeTab, closeMenu } = useSideMenu()
    const navigate = useNavigate()

    const [ logoutConfirm, setLogoutConfirm ] = useState(false)
    
    const logoutRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (
                logoutRef.current &&
                !logoutRef.current.contains(event.target as Node)
            ) {
                if (activeTab !== "user") {
                    setTimeout(() => {
                        setLogoutConfirm(false)
                    }, 300)
                }
                else setLogoutConfirm(false)
            }
        };
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, []);

    return (
        <div className="accountList SMlist">
            <div
                className={`SMaccount ${location.pathname === `/acc/${user.nick}` ? "active" : "" }`}
                onClick={() => {
                    navigate(`/acc/${user.nick}`);
                    closeMenu()
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
                <div className={`SMmainButt ${location.pathname === "/" ? "active" : ""}`} 
                    onClick={() => { 
                        navigate("/") 
                        closeMenu()
                    }}
                >
                    <span className="SMmainButtName">
                        <NewspaperIcon weight="fill" size={30} className="SMmainButtSvg"/> Лента <CaretRightIcon className="fastButtCaret"/>
                    </span>
                    <div className="SMmainButtDesc">Просматривайте единую ленту постов из спотов и от друзей, рекомендации, ближайшие активности и планы друзей</div>
                </div>
                <div className={`SMmainButt ${location.pathname === "/habit" ? "active" : ""}`} 
                    onClick={() => {
                        navigate("/habit")
                        closeMenu()
                    }}
                >
                    <span className="SMmainButtName">
                        <SneakerMoveIcon weight="fill" size={30} className="SMmainButtSvg"/> Активности <CaretRightIcon className="fastButtCaret"/>
                    </span>
                    <div className="SMmainButtDesc">Следите за активностями, стройте планы, отметьте достижения и проверьте календарь</div>
                </div>
                <div className={`SMaccountButt ${location.pathname.includes("/settings") ? "active" : "" }`} 
                    onClick={() => {
                        navigate("/settings")
                        closeMenu()
                    }}
                >
                    <span className="settingName">
                        <GearIcon size={21} weight="fill"/> 
                        Настройки
                    </span>
                        <CaretRightIcon className="fastButtCaret"/>
                </div>
                <div className="SMaccountButt" 
                    onClick={() => {
                        navigate(`/chat/${user.nick}`)
                        closeMenu()
                    }}
                >
                    <span className="settingName">
                        <BookmarkSimpleIcon weight="fill"/> 
                        Избранное
                    </span>
                    <CaretRightIcon className="fastButtCaret"/>
                </div>
                <div className="SMaccountButt logout" onClick={() => logoutConfirm ? logOut() : setLogoutConfirm(true)} ref={logoutRef}>
                    <span className="settingName" key={logoutConfirm ? "confirm" : "default"}>
                        {logoutConfirm ? <><CheckIcon size={21}/> Подтвердить выход</> : <><SignOutIcon weight="fill" size={21}/> Выйти из аккаунта</>}
                    </span>
                </div>
<div className="SMaccountButt">
    Высота body: {document.body.getBoundingClientRect().height}px, html: {document.documentElement.getBoundingClientRect().height}px, root: {document.getElementById("root")?.getBoundingClientRect().height}px, layout: {document.querySelector(".mobile-layout")?.getBoundingClientRect().height}px,
</div>
<div className="SMaccountButt">
    innerHeight: {window.innerHeight}px, visualViewport.height: {window.visualViewport?.height}px, visualViewport.offsetTop: {window.visualViewport?.offsetTop}px
</div>
<div className="SMAccountButt">
    root top: {document.getElementById("root")?.getBoundingClientRect().top}px,
    root bottom: {document.getElementById("root")?.getBoundingClientRect().bottom}px,
    root clientHeight: {document.getElementById("root")?.clientHeight}px,
    root CSS height: {getComputedStyle(document.getElementById("root")!).height},
    root CSS flex: {getComputedStyle(document.getElementById("root")!).flex},
    root CSS margin: {getComputedStyle(document.getElementById("root")!).margin},
    body display: {getComputedStyle(document.body).display},
    body align-items: {getComputedStyle(document.body).alignItems}
</div>
            </div>
        </div>
    )
}