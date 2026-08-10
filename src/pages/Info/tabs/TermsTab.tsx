import { useTranslation } from "react-i18next";

export default function TermsTab() {
    const { t } = useTranslation("info");

    return (
        <div className="infoTab">
            <h2 className="accent">{t("terms.title")}</h2>

            <p>{t("terms.effectiveDate")}</p>

            <h3 className="accent">{t("terms.s1")}</h3>
            <p>{t("terms.s1_1")}</p>
            <p>{t("terms.s1_2")}</p>
            <p>{t("terms.s1_3")}</p>
            <p>{t("terms.s1_4")}</p>

            <h3 className="accent">{t("terms.s2")}</h3>
            <p>{t("terms.s2_1")}</p>
            <ul>
                <li>{t("terms.s2li1")}</li>
                <li>{t("terms.s2li2")}</li>
                <li>{t("terms.s2li3")}</li>
                <li>{t("terms.s2li4")}</li>
                <li>{t("terms.s2li5")}</li>
            </ul>

            <h3 className="accent">{t("terms.s3")}</h3>
            <p>{t("terms.s3_1")}</p>
            <p>{t("terms.s3_2")}</p>
            <p>{t("terms.s3_3")}</p>
            <p>{t("terms.s3_4")}</p>

            <h3 className="accent">{t("terms.s4")}</h3>
            <p>{t("terms.s4_1")}</p>
            <p>{t("terms.s4_2")}</p>
            <p>{t("terms.s4_3")}</p>
            <ul>
                <li>{t("terms.s4li1")}</li>
                <li>{t("terms.s4li2")}</li>
                <li>{t("terms.s4li3")}</li>
                <li>{t("terms.s4li4")}</li>
                <li>{t("terms.s4li5")}</li>
                <li>{t("terms.s4li6")}</li>
            </ul>

            <h3 className="accent">{t("terms.s5")}</h3>
            <p>{t("terms.s5p1")}</p>
            <ul>
                <li>{t("terms.s5li1")}</li>
                <li>{t("terms.s5li2")}</li>
                <li>{t("terms.s5li3")}</li>
                <li>{t("terms.s5li4")}</li>
                <li>{t("terms.s5li5")}</li>
            </ul>

            <h3 className="accent">{t("terms.s6")}</h3>
            <p>{t("terms.s6p1")}</p>
            <p>{t("terms.s6p2")}</p>

            <h3 className="accent">{t("terms.s7")}</h3>
            <p>{t("terms.s7p1")}</p>

            <h3 className="accent">{t("terms.s8")}</h3>
            <p>{t("terms.s8p1")}</p>

            <h3 className="accent">{t("terms.s9")}</h3>
            <p>{t("terms.s9p1")}</p>

            <h3 className="accent">{t("terms.s10")}</h3>
            <p>{t("terms.s10p1")}</p>
        </div>
    );
}