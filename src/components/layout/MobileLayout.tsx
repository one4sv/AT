import type { ReactNode } from "react";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import Header from "../ts/Header";
import SideMenu from "../ts/SideMenu";
import { useLocation } from "react-router-dom";

interface LayoutProps {
    children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const { decor } = useSettings();
    const location = useLocation();

    const hideHeader = 
        location.pathname.startsWith("/chat") || 
        location.pathname.startsWith("/habit/")

    return (
        <div className="mobile-layout">
            {!hideHeader && <Header />}
            <SideMenu/>
            {decor === "glass" && <Background />}
            <div className="page-content">
                {decor === "default" && <Background />}
                {children}
            </div>
        </div>
    );
}