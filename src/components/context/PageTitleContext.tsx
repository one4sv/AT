import { createContext, useEffect, useState, type ReactNode, type SetStateAction } from "react";
import type { MenuOptions } from "./ContextMenuContext";

const PageTitleContext = createContext<PageTitleContextType | null>(null);

export interface PageTitleContextType {
  title:string
  setTitle: React.Dispatch<SetStateAction<string>>
  titleIcon: ReactNode
  setTitleIcon: React.Dispatch<SetStateAction<ReactNode>>
  hideHeader:boolean
  setHideHeader: React.Dispatch<SetStateAction<boolean>>
  headerMenu: { point: string; options: MenuOptions } | null
  setHeaderMenu: React.Dispatch<SetStateAction<{ point: string; options: MenuOptions } | null>>
} 

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState("Achieve Together");
  const [titleIcon, setTitleIcon] = useState<ReactNode>(null);
  const [hideHeader, setHideHeader] = useState(false);
  const [headerMenu, setHeaderMenu] = useState<{ point: string; options: MenuOptions } | null>(null);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <PageTitleContext.Provider value={{ title, setTitle, titleIcon, setTitleIcon, hideHeader, setHideHeader, headerMenu, setHeaderMenu }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export default PageTitleContext
