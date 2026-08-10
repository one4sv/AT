import { Link } from "react-router-dom";
import O4sv from "../../../assets/pics/O4";
import SelectList from "../../../components/ts/SelectList";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../components/hooks/UpdateSettingsHook";
import { useTranslation } from "react-i18next";

export default function LandingFooter({ isDark }: { isDark: boolean }) {
    const { lang } = useSettings();
    const { setNewLang } = useUpSettings();
    const { t } = useTranslation("common");

    const langArr = [
        { label: t("footer.russian"), value: "ru" },
        { label: t("footer.english"), value: "en" }
    ];

    return (
        <div className="landingFooter">
            <div className="o4studio">
                <O4sv color={isDark ? "white" : "black"} />
                one4sv studio
            </div>

            <div>
                <Link to="/info/about">{t("footer.about")}</Link>
                <Link to="/info/terms">{t("footer.terms")}</Link>
                <Link to="/info/policy">{t("footer.policy")}</Link>
                <Link to="/info/contacts">{t("footer.contacts")}</Link>
                <Link to="/info/faq">{t("footer.faq")}</Link>

                <SelectList
                    className="landingSL"
                    arr={langArr}
                    selected={lang}
                    extraFunction={setNewLang}
                    chevron={false}
                />
            </div>
        </div>
    );
}