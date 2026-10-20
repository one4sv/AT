import { Outlet, useLocation } from "react-router-dom";
import { isMobile } from "react-device-detect";
import MainLayout from "./MainLayout";
import MobileLayout from "./MobileLayout";
import Skeleton, { type SkeletonType } from "../ts/Skeleton";
import { useUser } from "../hooks/UserHook";
import { useSettings } from "../hooks/SettingsHook";

export default function ResponsiveLayout() {
    const { settingsLoaded, layout } = useSettings();
    const { initialLoading, user } = useUser();
    const { pathname } = useLocation();
    const type: SkeletonType = pathname.startsWith("/habit") ? "habit"
        : pathname.startsWith("/chat") ? "chat"
        : pathname === "/" ? "feed" : "profile";
    const content = initialLoading || !settingsLoaded
        ? <Skeleton type={type} count={type === "chat" ? 5 : 3} overview={pathname === "/habit"} />
        : <Outlet key={user.id ?? "guest"} />;

    if (isMobile || layout === "hidden") {
        return (
            <MobileLayout>
                {content}
            </MobileLayout>
        );
    }

    return (
        <MainLayout>
            {content}
        </MainLayout>
    );
}
