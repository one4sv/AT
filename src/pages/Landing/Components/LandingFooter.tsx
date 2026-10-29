import { Link } from "react-router-dom";
import O4sv from "../../../assets/pics/O4";
import { useTranslation } from "react-i18next";
import { TranslateIcon, InfoIcon, HandshakeIcon, ShieldCheckIcon, AddressBookIcon, QuestionIcon } from "@phosphor-icons/react";

import BetaNotice from "../../../components/ts/BetaNotice";
import BetaArt from "../../../components/ts/BetaArt";

export default function LandingFooter({ isDark }: { isDark: boolean }) {
    const { t } = useTranslation("common");

    return (
        <div className="landingFooter">
            <BetaArt background/>
            <div className="o4studio">
                <O4sv color={isDark ? "white" : "black"} />
                one4sv studio
            </div>

            <p className="landingFooterNote">{t("footer.description")}</p>
            <BetaNotice className="landingBetaMobile"/>
            <div className="landingFooterLinks">
                <Link to="/info/about"><InfoIcon aria-hidden="true"/>{t("footer.about")}</Link>
                <Link to="/info/terms"><HandshakeIcon aria-hidden="true"/>{t("footer.terms")}</Link>
                <Link to="/info/policy"><ShieldCheckIcon aria-hidden="true"/>{t("footer.policy")}</Link>
                <Link to="/info/contacts"><AddressBookIcon aria-hidden="true"/>{t("footer.contacts")}</Link>
                <Link to="/info/faq"><QuestionIcon aria-hidden="true"/>{t("footer.faq")}</Link>

                <Link to="/settings/language" state={{ from: "/sign" }}><TranslateIcon aria-hidden="true"/>{t("footer.language")}</Link>
            </div>
        </div>
    );
}
