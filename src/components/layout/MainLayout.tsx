import type { ReactNode } from "react";
import SideMenu from "../ts/SideMenu";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";

interface LayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  const { decor } = useSettings();

  return (
    <div className="app-layout">
      <SideMenu />
      {decor === "glass" && <Background />}
      <div className="page-content">
        {decor === "default" && <Background />}
        {children}
      </div>
    </div>
  );
}
