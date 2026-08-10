import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TelegramLogoSvg from "../../../assets/icons/telegramlogo.svg";
import GithubLogo from "../../../assets/icons/git.png";
import GithubWhite from "../../../assets/icons/gitwhite.png";
import Inst from "../../../assets/icons/inst.svg";
import { useSettings } from "../../../components/hooks/SettingsHook";
import one4svlogo from "../../../assets/pics/one4svlogo.png";

export default function ContactsTab() {
    const { t } = useTranslation("info");
    const { isDark } = useSettings();

    return (
        <div className="infoTab">
            <div className="one4svlogo">
                <img src={one4svlogo} />
            </div>

            <h3 className="accent">{t("contacts.development")}</h3>

            <p>
                {t("contacts.developedBy")}{" "}
                <span className="accent">{t("contacts.studio")}</span>.
            </p>

            <h3 className="accent">{t("contacts.social")}</h3>

            <div className="contactsWrapper">
                <Link className="contact" to="https://github.com/one4sv">
                    <img src={isDark ? GithubWhite : GithubLogo} />
                    GitHub
                </Link>
                <Link className="contact" to="https://t.me/one4sv">
                    <img src={TelegramLogoSvg} className="telegramIcon" />
                    Telegram
                </Link>
                <Link className="contact" to="https://www.instagram.com/one4sv/">
                    <img src={Inst} className="telegramIcon" />
                    Instagram
                </Link>
            </div>

            <h3 className="accent">{t("contacts.support")}</h3>

            <p>{t("contacts.supportText1")}</p>

            <p>
                {t("contacts.email")}:{" "}
                <a href="mailto:kutenko18@gmail.com">kutenko18@gmail.com</a>
            </p>

            <p>{t("contacts.supportText2")}</p>

            <h3 className="accent">{t("contacts.aboutProject")}</h3>

            <p>{t("contacts.aboutProjectText")}</p>
        </div>
    );
}