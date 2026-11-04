import "../../scss/header.scss";
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import useCompactLayout from "../hooks/utils/useCompactLayout";
import { useLocation, useNavigate } from "react-router";
import { useSettings } from "../hooks/SettingsHook";
import { TextIndentIcon } from "@phosphor-icons/react";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { getHeaderScrollTarget } from "../ts/utils/pageScroll";
export default function Header() {
    const isMobile = useCompactLayout();
    const { openSideMenu } = useSideMenu();
    const { openMenu } = useContextMenu();
    const { layout } = useSettings();
    const {
        title,
        hideHeader
    } = usePageTitle();
    const location = useLocation();
    const navigate = useNavigate();
    const isInInfo = location.pathname.startsWith("/info/");
    const isInfo = location.pathname === "/info";
    const handleHeaderClick = () => {
        const scroller = getHeaderScrollTarget(location.pathname);

        if (scroller && scroller.scrollTop > 2) {
            scroller.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (isInInfo) {
            navigate("/info");
            return;
        }

        window.location.reload();
    };

    return (
        <>
            <div className={`headerDiv ${hideHeader ? "hide" : ""}`}>
                {isMobile || layout === "hidden" ? <div
                    className="headerButt"
                    data-context-menu="true"
                    onContextMenu={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        openMenu(e.clientX, e.clientY, "headerQuickAction", { id: "headerQuickAction" });
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onClick={() => openSideMenu()}
                >
                    <TextIndentIcon />
                </div> : ""}
                <div
                    className={`header headerTitle ${isInInfo || isInfo ? "headerInfo" : ""}`}
                    onClick={handleHeaderClick}
                >
                    {title}
                </div>
            </div>
        </>
    );
}
