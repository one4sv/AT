import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeftIcon, CheckCircleIcon, TranslateIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../components/hooks/SettingsHook";
import { useUpSettings } from "../../components/hooks/UpdateSettingsHook";
import { useUser } from "../../components/hooks/UserHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import "./scss/language.scss";
import "../../scss/landingBackground.scss";

export default function Language() {
    const { lang } = useSettings();
    const { setNewLang } = useUpSettings();
    const { user } = useUser();
    const { setTitle } = usePageTitle();
    const { t } = useTranslation("settings");
    const location = useLocation();
    const reduced = useReducedMotion();
    const source = location.state?.from;
    const back = typeof source === "string" && source.startsWith("/") && !source.startsWith("//") ? source : user.id ? "/settings" : "/sign";

    useEffect(() => { setTitle(t("general.language")); }, [setTitle, t]);

    return (
        <div className="languagePage">
            <div className="background landingBackground" aria-hidden="true"/>
            <motion.main className="languageCard" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }}>
                <Link className="languageBack" to={back}><ArrowLeftIcon size={22}/>{t("language.back")}</Link>
                <TranslateIcon className="languageIcon" size={40} aria-hidden="true"/>
                <h1>{t("general.language")}</h1>
                <p>{t("language.description")}</p>
                <div className="languageChoices" role="group" aria-label={t("general.language")}>
                    {[{ code: "ru", name: "Русский", detail: "Russian" }, { code: "en", name: "English", detail: "Английский" }].map(item => (
                        <button type="button" key={item.code} className={`languageChoice ${lang === item.code ? "active" : ""}`} aria-pressed={lang === item.code} onClick={() => setNewLang(item.code)}>
                            <span lang={item.code}>{item.name}<small>{item.detail}</small></span>
                            {lang === item.code && <CheckCircleIcon weight="fill" size={24} aria-hidden="true"/>}
                        </button>
                    ))}
                </div>
            </motion.main>
        </div>
    );
}
