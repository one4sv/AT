import { List } from "@phosphor-icons/react"
import "../../scss/header.scss"
import { useSideMenu } from "../hooks/SideMenuHook";
import { usePageTitle } from "../hooks/PageContextHook";
import { isMobile } from "react-device-detect";

export default function Header() {
    const { showSideMenu, setShowSideMenu } = useSideMenu();
    const { title } = usePageTitle()

    return (
        <>
            <div className="header">
                {isMobile && (
                    <div className="menuShowButt" onClick={() => setShowSideMenu(!showSideMenu)}>
                        <List/>
                    </div>
                )}
                <div className="titleHeader">
                    {title}
                </div>
            </div>
        </>
    )
}