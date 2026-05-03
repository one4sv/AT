import { createContext, useEffect, useState, type ReactNode, type SetStateAction } from "react";

const PageTitleContext = createContext<PageTitleContextType | null>(null);

export interface PageTitleContextType {
  title:string
  setTitle: React.Dispatch<SetStateAction<string>>
} 

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState("Achieve Together");

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export default PageTitleContext
