import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next"

export default function AboutTab() {
    const { t } = useTranslation("info")

    return ( 
        <div className="infoTab"> 
            <h1>{t("about.title")}</h1>

            <p>
                <span className="accent">{t("about.intro1Accent")}</span>{" "}
                {t("about.intro1Text")}
            </p>

            <p>
                <span className="accent">{t("about.intro2Accent")}</span>{" "}
                {t("about.intro2Text")}
            </p>

            <p>
                <span className="accent">{t("about.intro3Accent")}</span>{" "}
                {t("about.intro3Text")}
            </p>

            <h3 className="accent">{t("about.aboutProject")}</h3>
            <p>{t("about.aboutProjectText")}</p>

            <h3 className="accent">{t("about.warning")}</h3>
            <p>{t("about.warningText")}</p>

            <h3 className="accent">{t("about.features")}</h3>

            <ul>
                <li>{t("about.feature1")}</li>
                <li>{t("about.feature2")}</li>
                <li>{t("about.feature3")}</li>
                <li>{t("about.feature4")}</li>
                <li>{t("about.feature5")}</li>
            </ul>

            <h3 className="accent">{t("about.feedback")}</h3>

            <p>
                {t("about.feedbackText1")}{" "}
                <Link to="/info/contacts"> {t("about.contacts")}</Link>
                {t("about.feedbackText2")}
            </p>

            <h3 className="accent">{t("about.future")}</h3>

            <p>{t("about.futureText")}</p>

            <ul>
                <li>{t("about.future1")}</li>
                <li>{t("about.future2")}</li>
                <li>{t("about.future3")}</li>
                <li>{t("about.future4")}</li>
                <li>{t("about.future5")}</li>
                <li>{t("about.future6")}</li>
                <li>{t("about.future7")}</li>
                <li>{t("about.future8")}</li>
            </ul>

            <h3 className="accent">{t("about.commercial")}</h3>

            <p>{t("about.commercialText")}</p>

            <p>
                {t("about.version")}:{" "}
                <span className="accent">beta 0.5.7</span>
            </p>
        </div>
    );
}
