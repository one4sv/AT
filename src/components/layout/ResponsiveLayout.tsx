import { Outlet } from "react-router-dom";
import { isMobile } from "react-device-detect";
import MainLayout from "./MainLayout";
import MobileLayout from "./MobileLayout";

export default function ResponsiveLayout() {
  if (isMobile) {
    return (
      <MobileLayout>
        <Outlet />
      </MobileLayout>
    );
  } else
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
