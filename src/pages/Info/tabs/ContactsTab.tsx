import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TelegramLogoSvg from "../../../assets/icons/telegramlogo.svg";
import GithubLogo from "../../../assets/icons/git.png";
import GithubWhite from "../../../assets/icons/gitwhite.png";
import Inst from "../../../assets/icons/inst.svg";
import { useSettings } from "../../../components/hooks/SettingsHook";

import SectionArt from "../../../components/ts/SectionArt";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { ChatCircleTextIcon } from "@phosphor-icons/react";

export default function ContactsTab() {
    const { t } = useTranslation("info");
    const { isDark } = useSettings();
    const { setBlackout } = useBlackout();

    return (
        <div className="infoText">
            <SectionArt theme="contacts"/>

            <h3 className="accent">{t("contacts.development")}</h3>

            <p>
                {t("contacts.developedBy")}{" "}
                <span className="accent">{t("contacts.studio")}</span>.
            </p>
            <a className="one4svlogo" href="https://one4sv.studio/" target="_blank" rel="noopener noreferrer" aria-label="one4sv.studio">
                <span>one</span><span className="studioLogoAccent"><span className="studioLogoFour">4</span>sv.</span><span>studio</span>
            </a>

            <h3 className="accent">{t("contacts.social")}</h3>

            <div className="contactsWrapper">
                <a className="contact" href="https://one4sv.studio/" target="_blank" rel="noopener noreferrer">
                    <img src="https://one4sv-studio.vercel.app/assets/favicon.svg" alt="" className="studioFavicon" />
                    one4sv.studio
                </a>
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
            <button type="button" className="contactFeedbackButton"
                onClick={() => setBlackout({ seted: true, module: "FeedbackModal" })}>
                <ChatCircleTextIcon size={22}/> {t("contacts.feedbackOpen")}
            </button>

            <h3 className="accent">{t("contacts.aboutProject")}</h3>

            <p>{t("contacts.aboutProjectText")}</p>
        </div>
    );
}