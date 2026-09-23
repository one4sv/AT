import "../../scss/header.scss"
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import { isMobile } from "react-device-detect";
import { useLocation, useParams } from "react-router";
import { useSettings } from "../hooks/SettingsHook";
import { TextIndentIcon } from "@phosphor-icons/react";

export default function Header() {
    const { openSideMenu } = useSideMenu();
    const { layout } = useSettings()
    const { nick } = useParams()
    const { title } = usePageTitle()
    const location = useLocation()
    const isAcc = location.pathname.startsWith("/acc")
    
    return (
        <>
            <div className="headerDiv">
                {isMobile || layout === "hidden" ? (
                <div
                    className="headerButt"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => openSideMenu()}
                >
                    <TextIndentIcon />
                </div>
                ) : ""}
                <div className="header headerTitle">
                    { isAcc ? nick : title }
                </div>
            </div>
        </>
    )
}