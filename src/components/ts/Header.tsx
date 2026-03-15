import { List } from "@phosphor-icons/react"
import "../../scss/header.scss"
import { useSideMenu } from "../hooks/SideMenuHook";

export default function Header() {
    const { showSideMenu, setShowSideMenu } = useSideMenu();
    return (
        <>
            <div className="header">
                <div className="menuShowButt" onClick={() => setShowSideMenu(!showSideMenu)}>
                    <List/>
                </div>
                <div className="titleHeader">
                    Achieve Together
                </div>
            </div>
        </>
    )
}