import { Link } from "react-router-dom";
import O4sv from "../../../assets/pics/O4"

export default function LandingFooter({isDark}:{isDark:boolean}) {        
    return (
        <div className="landingFooter">
            <div className="o4studio"><O4sv color={isDark ? "white" : "black"}/>one4sv studio</div>
            <div>
                <Link to="/info/about">О проекте</Link>
                <Link to="/info/terms">Пользовательское соглашение</Link>
                <Link to="/info/policy">Политика конфиденциальности</Link>
                <Link to="/info/contacts">Контакты</Link>
                <Link to="/info/faq">FAQ</Link>
                <span>Русский</span>
            </div>
        </div>
    )
}