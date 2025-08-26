import { Outlet } from "react-router-dom";
import SideMenu from "../ts/SideMenu";

export default function MainLayout() {
  return (
    <div className="app-layout">
      <SideMenu />
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}
