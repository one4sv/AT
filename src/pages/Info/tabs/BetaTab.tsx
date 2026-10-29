import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BetaArt from "../../../components/ts/BetaArt";
import "../../../scss/BetaNotice.scss";

export default function BetaTab() {
    const { t } = useTranslation("info");
    return <div className="infoText betaInfo">
        <div className="betaInfoArt"><BetaArt/></div>
        <h1>{t("beta.title")}</h1>
        <p>{t("beta.intro")}</p>
        <h3>{t("beta.expectTitle")}</h3>
        <p>{t("beta.expect")}</p>
        <h3>{t("beta.dataTitle")}</h3>
        <p>{t("beta.data")}</p>
        <h3>{t("beta.helpTitle")}</h3>
        <p>{t("beta.help")}</p>
        <ul>
            <li>{t("beta.steps")}</li>
            <li>{t("beta.result")}</li>
            <li>{t("beta.device")}</li>
            <li>{t("beta.capture")}</li>
        </ul>
        <p>{t("beta.secrets")}</p>
        <Link to="/info/contacts">{t("beta.contact")}</Link>
        <h3>{t("beta.nextTitle")}</h3>
        <p>{t("beta.next")}</p>
    </div>;
}
