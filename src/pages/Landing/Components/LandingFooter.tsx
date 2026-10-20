import { Link } from "react-router-dom";
import O4sv from "../../../assets/pics/O4";
import { useTranslation } from "react-i18next";
import { TranslateIcon } from "@phosphor-icons/react";

export default function LandingFooter({ isDark }: { isDark: boolean }) {
    const { t } = useTranslation("common");

    return (
        <div className="landingFooter">
            <div className="o4studio">
                <O4sv color={isDark ? "white" : "black"} />
                one4sv studio
            </div>

            <p className="landingFooterNote">{t("footer.description")}</p>
            <div className="landingFooterLinks">
                <Link to="/info/about">{t("footer.about")}</Link>
                <Link to="/info/terms">{t("footer.terms")}</Link>
                <Link to="/info/policy">{t("footer.policy")}</Link>
                <Link to="/info/contacts">{t("footer.contacts")}</Link>
                <Link to="/info/faq">{t("footer.faq")}</Link>

                <Link to="/settings/language" state={{ from: "/sign" }}><TranslateIcon size={20}/>{t("footer.language")}</Link>
            </div>
        </div>
    );
}
