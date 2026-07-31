import { Link } from "react-router-dom";

export default function LandingFooter() {        
    return (
        <div className="landingFooter">
            <div>Achieve Together</div>
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