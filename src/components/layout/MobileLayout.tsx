import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import Header from "../ts/Header";
import SideMenu from "../ts/SideMenu";
import { useSideMenu } from "../hooks/SideMenuHook";

interface LayoutProps {
    children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const { decor } = useSettings();
    const { showSideMenu } = useSideMenu()
    const location = useLocation();

    const hideHeader = 
        location.pathname.startsWith("/chat") && !showSideMenu|| 
        location.pathname.startsWith("/habit/") && !showSideMenu

    return (
        <div className="mobile-layout">
            {!hideHeader && <Header />}
            {showSideMenu && <SideMenu/>}
            {decor === "glass" && <Background />}

            <div className="page-content">
                {decor === "default" && <Background />}
                {children}
            </div>
        </div>
    );
}