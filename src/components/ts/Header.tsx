import { List } from "@phosphor-icons/react"
import "../../scss/header.scss"
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import { isMobile } from "react-device-detect";
import { useLocation, useNavigate, useParams } from "react-router";
import { useUpUser } from "../hooks/UpdateUserHook";
import { useAcc } from "../hooks/AccHook";
import { useUser } from "../hooks/UserHook";

export default function Header() {
    const { showSideMenu, setShowSideMenu } = useSideMenu();
    const { isAuthenticated } = useUser()
    const { nick } = useParams()
    const { title } = usePageTitle()
    const { handleSave } = useUpUser()
    const { red, setRed } = useSideMenu()
    const { isMyAcc, acc } = useAcc()
    const location = useLocation()
    const isAcc = location.pathname.startsWith("/acc")
    const navigate = useNavigate()

    const accInfoButt = () => {
        if (isMyAcc) {
            if (red) handleSave();
            setRed(!red);
        } else {
            navigate(`/chat/${acc?.nick}`);
        }
    };
    console.log(isAcc)
    return (
        <>
            <div className="header">
                {isMobile && (
                <div className="menuShowButt" onClick={() => setShowSideMenu(!showSideMenu)}>
                    <List/>
                </div>
                )}
                <div className="titleHeader">
                    { isAcc ? nick : title }
                </div>
                {isAcc && isAuthenticated && (
                    <div className="accInfoRedButt" onClick={accInfoButt}>
                        {isMyAcc ? (red ? "Сохранить" : "Редактировать профиль") : "Написать сообщение"}
                    </div>
                )}
            </div>
        </>
    )
}