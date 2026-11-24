import PeriodOverview from "./PeriodOverview";
import { useTranslation } from "react-i18next";
import "../../scss/Diagrams.scss"
import type { RefObject } from "react";
import OverallStats from "./Diagrams/OverallStats";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";

export default function Diagrams(_props:{mainRef:RefObject<HTMLDivElement | null>}) {
    const {t}=useTranslation("common");
    const {setBlackout}=useBlackout();
    return <div className="statsDivStats">
        <div className="statsTitle">{t("statsUi.title")}</div>
        <div className="statsOverviewContent">
            <PeriodOverview/>
            <OverallStats openDiagram={value=>setBlackout({seted:true,module:"HabitStatisticsCharts",options:{name:value}})}/>
        </div>
    </div>;
}
