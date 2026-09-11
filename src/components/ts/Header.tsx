import { List } from "@phosphor-icons/react"
import "../../scss/header.scss"
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import { isMobile } from "react-device-detect";
import { useLocation, useParams } from "react-router";
import { useSettings } from "../hooks/SettingsHook";

export default function Header() {
    const { setTranslateX, setShowSideMenu } = useSideMenu();
    const { layout } = useSettings()
    const { nick } = useParams()
    const { title } = usePageTitle()
    const location = useLocation()
    const isAcc = location.pathname.startsWith("/acc")
    console.log(layout)
    return (
        <>
            <div className="header">
                {isMobile || layout === "hidden" ? (
                <div className="menuShowButt" onClick={() => {
                    setShowSideMenu(true);
                    setTranslateX(0);
                }}>
                    <List/>
                </div>
                ) : ""}
                <div className="titleHeader">
                    { isAcc ? nick : title }
                </div>
            </div>
        </>
    )
}