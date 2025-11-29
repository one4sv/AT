import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import Header from "../ts/Header";

interface LayoutProps {
  children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const { decor } = useSettings();
    const location = useLocation();

    return (
        <div className="mobile-layout">
            {!location.pathname.includes("/chat") && <Header />}
            {decor === "glass" && <Background />}
            <div className="page-content">
                {decor === "default" && <Background />}
                {children}
            </div>
        </div>
    );
}
