import { Outlet } from "react-router-dom";
import SideMenu from "../ts/SideMenu";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";

export default function MainLayout() {
  const { decor } = useSettings()
  return (
    <div className="app-layout">
      <SideMenu />
      {decor === "glass" ? (<Background/>) : ("")}
      <div className="page-content">
        {decor === "default" ? (<Background/>) : ("")}
        <Outlet />
      </div>
    </div>
  );
}
