import { Outlet } from "react-router-dom";
import { isMobile } from "react-device-detect";
import MainLayout from "./MainLayout";
import MobileLayout from "./MobileLayout";
import Loader from "../ts/Loader";
import { useSettings } from "../hooks/SettingsHook";

export default function ResponsiveLayout() {
    const { settingsLoaded } = useSettings();

    if (!settingsLoaded) {
        return <Loader />;
    }

    if (isMobile) {
        return (
            <MobileLayout>
                <Outlet />
            </MobileLayout>
        );
    }

    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    );
}