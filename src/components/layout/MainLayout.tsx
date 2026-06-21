import {  useEffect, type ReactNode } from "react";
import SideMenu from "../ts/SideMenu";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import { useDrop } from "../hooks/DropHook";
import { File } from "@phosphor-icons/react"
import { useLocation, useNavigate } from "react-router";
import Header from "../ts/Header";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useSideMenu } from "../hooks/SideMenuHook";
import { useChat } from "../hooks/ChatHook";

interface LayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  const { decor } = useSettings();
  const { blackout, setBlackout } = useBlackout()
  const { isChose, setIsChose, setChosenMess, setAnswer, answer, editing, redirect, setEditing, setRedirect } = useMessages()
  const { handleDrop, handleDragOver, handleDragEnter, handleDragLeave, isDragging } = useDrop()
  const { showHabitMenu, returnSlide} = useSideMenu()
  const { mainSearchRef, search, setSearch, searchInputRef, searchMess, setSearchMess } = useChat()

  const navigate = useNavigate()
  const location = useLocation()
  const needDrag = location.pathname === "/" || location.pathname.startsWith("/chat")
  const hideHeader = location.pathname.startsWith("/chat") || location.pathname.startsWith("/habit/")
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (blackout.seted) {
        setBlackout({ seted: false, module: undefined });
        return;
      }

      if (mainSearchRef.current && document.activeElement === mainSearchRef.current || search.length > 0) {
        mainSearchRef.current?.blur()
        setSearch("")
        return
      }

      if (location.pathname.startsWith("/chat")) {
        if (searchInputRef.current && document.activeElement === searchInputRef.current || searchMess.length > 0) {
          searchInputRef.current?.blur()
          setSearchMess("")
          return
        }
        if (isChose) {
          setIsChose(false);
          setChosenMess([]);
          return;
        }
        if (answer || editing || redirect) {
          setAnswer(null)
          setEditing(null)
          setRedirect(undefined)
          return
        }

        navigate("/");
        return;
      }

      if (location.pathname.startsWith("/habit")) {
        if (showHabitMenu) {
            returnSlide();
            return;
        }
        navigate("/habit");
      }
      if (location.pathname.startsWith("/acc/")) {
        navigate(location.pathname.replace("/acc/", "/chat/"));
      }      
      if (location.pathname.startsWith("/room/")) {
        navigate(location.pathname.replace("/room/", "/chat/g/"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [answer, blackout.seted, editing, isChose, location.pathname, mainSearchRef, navigate, redirect, returnSlide, search.length, searchInputRef, searchMess.length, setAnswer, setBlackout, setChosenMess, setEditing, setIsChose, setRedirect, setSearch, setSearchMess, showHabitMenu]);

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
        {!hideHeader && <Header />}
        {children}
      </div>
    </div>
  );
}
