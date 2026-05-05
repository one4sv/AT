import { Ghost } from "lucide-react";
import { isMobile } from "react-device-detect";
import { Link } from "react-router-dom";

export default function SideMenuUnAunthificated () {
    return (
        <div className={`sideMenu ${isMobile ? "mobileSM" : ""}`}>
            <div className="sideMenuUnAthorised">
                
                <span><Ghost /> Вы не вошли в аккаунт</span>
                <Link to={'/sign'} className="whiteButt">войти</Link>
            </div>
        </div>
    )
}