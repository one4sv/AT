import "../../scss/header.scss";
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import useCompactLayout from "../hooks/utils/useCompactLayout";
import { useLocation, useNavigate } from "react-router";
import { useSettings } from "../hooks/SettingsHook";
import { TextIndentIcon } from "@phosphor-icons/react";
export default function Header() {
    const isMobile = useCompactLayout();
    const { openSideMenu } = useSideMenu();
    const { layout } = useSettings();
    const {
        title,
        hideHeader
    } = usePageTitle();
    const location = useLocation();
    const navigate = useNavigate();
    const isSettings = location.pathname.startsWith("/settings");
    const isInInfo = location.pathname.startsWith("/info/");
    const isInfo = location.pathname === "/info";

    return (
        <>
            <div className={`headerDiv ${hideHeader ? "hide" : ""}`}>
                {isMobile || layout === "hidden" ? <div
                    className="headerButt"
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onClick={() => openSideMenu()}
                >
                    <TextIndentIcon />
                </div> : ""}
                <div
                    className="header headerTitle"
                    onClick={() => {
                        if (isSettings) navigate("/settings"); else if (isInInfo) navigate("/info"); else if (isInfo) navigate("/settings");
                    }}
                >
                    {title}
                </div>
            </div>
        </>
    );
}
