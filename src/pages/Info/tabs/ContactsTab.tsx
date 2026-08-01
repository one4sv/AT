import { Link } from "react-router-dom";
import TelegramLogoSvg from "../../../assets/icons/telegramlogo.svg"
import GithubLogo from "../../../assets/icons/git.png"
import GithubWhite from "../../../assets/icons/gitwhite.png"
import Inst from "../../../assets/icons/inst.svg"
import { useSettings } from "../../../components/hooks/SettingsHook";
import one4svlogo from "../../../assets/pics/one4svlogo.png"

export default function ContactsTab() {
    const { theme } = useSettings()
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark =
        theme === "dark" ||
        (theme === "system" && systemDark);
    return (
        <div className="infoTab">
            <div className="one4svlogo">
                <img
                    src={one4svlogo}
                />
            </div>

            <h3 className="acsent">Разработка</h3>

            <p>
                Achieve Together разрабатывается студией{" "}
                <span className="acsent">one4sv studio</span>.
            </p>

            <h3 className="acsent">Социальные сети</h3>

            <div className="contactsWrapper">
                <Link className="contact" to="https://github.com/one4sv">
                    <img
                        src={isDark ? GithubWhite : GithubLogo}
                    />
                    GitHub
                </Link>                
                <Link className="contact" to="https://t.me/one4sv">
                    <img 
                        src={TelegramLogoSvg} 
                        className="telegramIcon"
                    />
                    Telegram
                </Link>                
                <Link className="contact" to="https://www.instagram.com/one4sv/">
                    <img 
                        src={Inst} 
                        className="telegramIcon"
                    />
                    Instagram
                </Link>
            </div>

            <h3 className="acsent">Поддержка</h3>

            <p>
                Если у вас есть вопросы, предложения, замечания или вы нашли
                ошибку в работе Achieve Together, вы можете связаться с нами.
            </p>

            <p>
                Email:{" "}
                <a href="mailto:kutenko18@gmail.com">
                    kutenko18@gmail.com
                </a>
            </p>

            <p>
                Мы открыты к обратной связи и предложениям по развитию проекта.
            </p>

            <h3 className="acsent">О проекте</h3>

            <p>
                Achieve Together находится в стадии бета-тестирования.
                Мы продолжаем развивать сервис, добавляя новые возможности
                для общения, публикаций и совместного достижения целей.
            </p>
        </div>
    )
}