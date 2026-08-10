import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function FaqTab() {
    const { t } = useTranslation("info");

    return (
        <div className="infoTab">
            <h2 className="accent">{t("faq.title")}</h2>

            <h3 className="accent">{t("faq.q1")}</h3>
            <p>{t("faq.a1")}</p>

            <h3 className="accent">{t("faq.q2")}</h3>
            <p>{t("faq.a2")}</p>

            <h3 className="accent">{t("faq.q3")}</h3>
            <p>{t("faq.a3")}</p>

            <h3 className="accent">{t("faq.q4")}</h3>
            <p>{t("faq.a4")}</p>

            <h3 className="accent">{t("faq.q5")}</h3>
            <p>{t("faq.a5")}</p>

            <h3 className="accent">{t("faq.q6")}</h3>
            <p>{t("faq.a6")}</p>

            <h3 className="accent">{t("faq.q7")}</h3>
            <p>{t("faq.a7")}</p>

            <h3 className="accent">{t("faq.q8")}</h3>
            <p>{t("faq.a8")}</p>

            <h3 className="accent">{t("faq.q9")}</h3>
            <p>
                {t("faq.a9Start")}{" "}
                <Link to="/info/contacts">{t("faq.contacts")}</Link>
                {t("faq.a9End")}
            </p>

            <h3 className="accent">{t("faq.q10")}</h3>
            <p>
                {t("faq.a10Start")}{" "}
                <Link to="/info/contacts">{t("faq.contacts")}</Link>
                {t("faq.a10End")}
            </p>

            <h3 className="accent">{t("faq.q11")}</h3>
            <p>{t("faq.a11")}</p>
        </div>
    );
}