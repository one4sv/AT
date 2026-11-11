import { createContext, useEffect, useState, type ReactNode, type SetStateAction } from "react";

const PageTitleContext = createContext<PageTitleContextType | null>(null);

export interface PageTitleContextType {
  title:string
  setTitle: React.Dispatch<SetStateAction<string>>
  titleIcon: ReactNode
  setTitleIcon: React.Dispatch<SetStateAction<ReactNode>>
  hideHeader:boolean
  setHideHeader: React.Dispatch<SetStateAction<boolean>>
} 

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState("Achieve Together");
  const [titleIcon, setTitleIcon] = useState<ReactNode>(null);
  const [hideHeader, setHideHeader] = useState(false);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <PageTitleContext.Provider value={{ title, setTitle, titleIcon, setTitleIcon, hideHeader, setHideHeader }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export default PageTitleContext
