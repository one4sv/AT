import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PolicyTab() {
    const { t } = useTranslation("info");

    return (
        <div className="infoTab">
            <h2 className="accent">{t("policy.title")}</h2>

            <p>{t("policy.effectiveDate")}</p>

            <h3 className="accent">{t("policy.s1")}</h3>
            <p>{t("policy.s1p1")}</p>
            <p>{t("policy.s1p2")}</p>

            <h3 className="accent">{t("policy.s2")}</h3>
            <p>{t("policy.s2p1")}</p>
            <ul>
                <li>{t("policy.s2li1")}</li>
                <li>{t("policy.s2li2")}</li>
                <li>{t("policy.s2li3")}</li>
                <li>{t("policy.s2li4")}</li>
                <li>{t("policy.s2li5")}</li>
                <li>{t("policy.s2li6")}</li>
                <li>{t("policy.s2li7")}</li>
                <li>{t("policy.s2li8")}</li>
            </ul>

            <h3 className="accent">{t("policy.s3")}</h3>
            <p>{t("policy.s3p1")}</p>
            <ul>
                <li>{t("policy.s3li1")}</li>
                <li>{t("policy.s3li2")}</li>
                <li>{t("policy.s3li3")}</li>
                <li>{t("policy.s3li4")}</li>
                <li>{t("policy.s3li5")}</li>
                <li>{t("policy.s3li6")}</li>
            </ul>

            <h3 className="accent">{t("policy.s4")}</h3>
            <p>{t("policy.s4p1")}</p>
            <p>{t("policy.s4p2")}</p>
            <p>{t("policy.s4p3")}</p>

            <h3 className="accent">{t("policy.s5")}</h3>
            <p>{t("policy.s5p1")}</p>
            <p>{t("policy.s5p2")}</p>

            <h3 className="accent">{t("policy.s6")}</h3>
            <p>{t("policy.s6p1")}</p>
            <ul>
                <li>{t("policy.s6li1")}</li>
                <li>{t("policy.s6li2")}</li>
                <li>{t("policy.s6li3")}</li>
                <li>{t("policy.s6li4")}</li>
                <li>{t("policy.s6li5")}</li>
            </ul>
            <p>{t("policy.s6p2")}</p>

            <h3 className="accent">{t("policy.s7")}</h3>
            <p>{t("policy.s7p1")}</p>
            <p>{t("policy.s7p2")}</p>

            <h3 className="accent">{t("policy.s8")}</h3>
            <p>{t("policy.s8p1")}</p>
            <p>{t("policy.s8p2")}</p>
            <p>{t("policy.s8p3")}</p>

            <h3 className="accent">{t("policy.s9")}</h3>
            <p>{t("policy.s9p1")}</p>
            <ul>
                <li>{t("policy.s9li1")}</li>
                <li>{t("policy.s9li2")}</li>
                <li>{t("policy.s9li3")}</li>
                <li>{t("policy.s9li4")}</li>
            </ul>

            <h3 className="accent">{t("policy.s10")}</h3>
            <p>{t("policy.s10p1")}</p>
            <p>{t("policy.s10p2")}</p>

            <h3 className="accent">{t("policy.s11")}</h3>
            <p>
                {t("policy.s11p1Start")}{" "}
                <Link to="/info/contacts">{t("policy.contacts")}</Link>
                {t("policy.s11p1End")}
            </p>
            <p>{t("policy.s11p2")}</p>
        </div>
    );
}