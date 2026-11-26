import "../../scss/header.scss";
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import useCompactLayout from "../hooks/utils/useCompactLayout";
import { useLocation, useNavigate } from "react-router";
import { useSettings } from "../hooks/SettingsHook";
import { useUser } from "../hooks/UserHook";
import { DotsThreeOutlineVerticalIcon, TextIndentIcon } from "@phosphor-icons/react";
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
    const { openMenu, closeMenu, menu } = useContextMenu();
    const { layout } = useSettings();
    const { user, initialLoading } = useUser();
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
    const profileHeaderMenu = location.pathname.startsWith("/acc/") && headerMenu?.point === "profileActions" ? headerMenu : null;
    const actionsMenu = planHeaderMenu || (isMobile ? profileHeaderMenu : null);
    const showActionsMenu = (x: number, y: number) => {
        if (profileHeaderMenu && menu.visible && menu.point === profileHeaderMenu.point) { closeMenu(); return; }
        if (actionsMenu) openMenu(x, y, actionsMenu.point, profileHeaderMenu ? {...actionsMenu.options, anchorRight: true} : actionsMenu.options);
    };
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
                {!hideMenuButton && (isMobile || layout === "hidden" || (!initialLoading && !user.id)) ? <div
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
                    data-header-gesture={planHeaderMenu ? "plan" : profileHeaderMenu ? "profile" : location.pathname.startsWith("/acc/") ? undefined : "quick"}
                    onContextMenu={e => {
                        e.preventDefault();
                        if (planHeaderMenu) showPlanMenu(e.clientX, e.clientY);
                        else if (profileHeaderMenu) { e.stopPropagation(); const rect = document.querySelector(".profileHeaderActionsButt")?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect(); showActionsMenu(rect.right, rect.bottom + 6); }
                        else if (!location.pathname.startsWith("/acc/")) openMenu(e.clientX, e.clientY, "headerQuickAction", { id: "headerQuickAction" });
                    }}
                    onClick={handleHeaderClick}
                >
                    {titleOverride === undefined && titleIcon && <span className="headerTitleTag">{titleIcon}</span>}
                    <span className="headerCustomText">{titleOverride ?? title}</span>
                    {titleSuffix}
                </div>
                {rightAction}
                {actionsMenu && <div role="button" tabIndex={0} className={`headerButt ${planHeaderMenu ? "planHeaderActionsButt" : "profileHeaderActionsButt"}`}
                    data-header-gesture={planHeaderMenu ? "plan" : "profile"} aria-label={planHeaderMenu ? t("plans.management") : t("actions", { ns: "acc" })}
                    onClick={event => {
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        showActionsMenu(profileHeaderMenu ? rect.right : rect.left, rect.bottom + 6);
                    }}
                    onContextMenu={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        showActionsMenu(profileHeaderMenu ? rect.right : event.clientX, profileHeaderMenu ? rect.bottom + 6 : event.clientY);
                    }}
                    onKeyDown={event => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        const rect = event.currentTarget.getBoundingClientRect();
                        showActionsMenu(profileHeaderMenu ? rect.right : rect.left, rect.bottom + 6);
                    }}>
                    <DotsThreeOutlineVerticalIcon weight="fill"/>
                </div>}
            </div>
        </>
    );
}
