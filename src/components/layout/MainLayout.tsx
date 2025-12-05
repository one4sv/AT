import {  type ReactNode } from "react";
import SideMenu from "../ts/SideMenu";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import { useDrop } from "../hooks/DropHook";
import { File } from "@phosphor-icons/react"
import { useLocation } from "react-router";

interface LayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  const { decor } = useSettings();
  const { handleDrop, handleDragOver, handleDragEnter, handleDragLeave, isDragging } = useDrop()
  const location = useLocation()
  const needDrag = location.pathname === "/" || location.pathname.startsWith("/chat")
  
  return (
    <div className="app-layout">
      <SideMenu />
      {decor === "glass" && <Background />}
      <div className="page-content" onDragOver={needDrag ? handleDragOver : undefined} onDrop={needDrag ? handleDrop : undefined}
        onDragEnter={needDrag ? handleDragEnter : undefined} onDragLeave={needDrag ? handleDragLeave : undefined
      }>
        {decor === "default" && <Background />}
        { isDragging && (
          <div className="darkLayout">
            <div className="darkLayoutDIv">
              <File/>
              Перетащите  файл, чтобы прикрепить
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
