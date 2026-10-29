import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BetaArt from "./BetaArt";
import "../../scss/BetaNotice.scss";

export default function BetaNotice({ className = "" }: { className?: string }) {
    const { t } = useTranslation("info");
    return <aside className={`betaNotice ${className}`}>
        <BetaArt/>
        <div className="betaNoticeText">
            <strong>{t("beta.hint")}</strong>
            <p>{t("beta.notice")}</p>
            <Link to="/info/beta">{t("beta.more")}</Link>
        </div>
    </aside>;
}
