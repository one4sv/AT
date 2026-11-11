import "../../scss/header.scss";
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import useCompactLayout from "../hooks/utils/useCompactLayout";
import { useLocation, useNavigate } from "react-router";
import { useSettings } from "../hooks/SettingsHook";
import { DotsThreeIcon, TextIndentIcon } from "@phosphor-icons/react";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { getHeaderScrollTarget } from "../ts/utils/pageScroll";
import { requestContentRefresh } from "../ts/utils/contentRefresh";
import useHeaderMenuGestures from "../hooks/utils/useHeaderMenuGestures";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
interface HeaderProps {
    titleOverride?: string;
    titleSuffix?: ReactNode;
    rightAction?: ReactNode;
    hideMenuButton?: boolean;
}

export default function Header({ titleOverride, titleSuffix, rightAction, hideMenuButton = false }: HeaderProps = {}) {
    const isMobile = useCompactLayout();
    const { t } = useTranslation("common");
    const headerGestures = useHeaderMenuGestures();
    const { openSideMenu } = useSideMenu();
    const { openMenu } = useContextMenu();
    const { layout } = useSettings();
    const {
        title,
        titleIcon,
        hideHeader,
        headerMenu
    } = usePageTitle();
    const location = useLocation();
    const navigate = useNavigate();
    const isInInfo = location.pathname.startsWith("/info/");
    const isInfo = location.pathname === "/info";
    const planHeaderMenu = location.pathname.startsWith("/plan/") && headerMenu?.point === "plan" ? headerMenu : null;
    const showPlanMenu = (x: number, y: number) => {
        if (planHeaderMenu) openMenu(x, y, planHeaderMenu.point, planHeaderMenu.options);
    };
    const handleHeaderClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (planHeaderMenu) {
            // ContextMenuProvider closes on a bubbling window click.
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            showPlanMenu(rect.left, rect.bottom + 6);
            return;
        }
        if (titleOverride !== undefined) return;
        const scroller = getHeaderScrollTarget(location.pathname);

        if (scroller && scroller.scrollTop > 2) {
            scroller.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (isInInfo) {
            navigate("/info");
            return;
        }

        requestContentRefresh("page", location.pathname);
    };

    return (
        <>
            <div className={`headerDiv ${hideHeader ? "hide" : ""}`} {...headerGestures}>
                {!hideMenuButton && (isMobile || layout === "hidden") ? <div
                    className="headerButt"
                    data-header-gesture="quick"
                    onContextMenu={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        openMenu(e.clientX, e.clientY, "headerQuickAction", { id: "headerQuickAction" });
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => openSideMenu()}
                >
                    <TextIndentIcon />
                </div> : ""}
                <div
                    className={`header headerTitle ${isInInfo || isInfo ? "headerInfo" : ""} ${titleOverride !== undefined ? "headerCustomTitle" : ""}`}
                    data-header-gesture={planHeaderMenu ? "plan" : "quick"}
                    onContextMenu={e => {
                        e.preventDefault();
                        if (planHeaderMenu) showPlanMenu(e.clientX, e.clientY);
                        else openMenu(e.clientX, e.clientY, "headerQuickAction", { id: "headerQuickAction" });
                    }}
                    onClick={handleHeaderClick}
                >
                    {titleOverride === undefined && titleIcon && <span className="headerTitleTag">{titleIcon}</span>}
                    <span className="headerCustomText">{titleOverride ?? title}</span>
                    {titleSuffix}
                </div>
                {rightAction}
                {planHeaderMenu && <button type="button" className="headerButt planHeaderActionsButt"
                    data-header-gesture="plan" aria-label={t("plans.management")}
                    onClick={event => {
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        showPlanMenu(rect.left, rect.bottom + 6);
                    }}
                    onContextMenu={event => {
                        event.preventDefault();
                        showPlanMenu(event.clientX, event.clientY);
                    }}>
                    <DotsThreeIcon weight="bold"/>
                </button>}
            </div>
        </>
    );
}
