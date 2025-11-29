import { List } from "@phosphor-icons/react"
import "../../scss/header.scss"
import SideMenu from "./SideMenu"
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

export default function Header() {
    const [ showSideMenu, setShowSideMenu ] = useState(false);
    const location = useLocation();
    useEffect(() => {
        if (location.pathname) setShowSideMenu(false);
    },[location.pathname])
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
            {showSideMenu && <SideMenu />}
        </>
    )
}