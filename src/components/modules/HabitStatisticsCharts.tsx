import { useEffect,useRef,useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import StatsFilters from "../../pages/HabitPage/components/Stats/StatsFilters";
import DoneDiagram from "../../pages/HabitPage/components/Stats/Diagrams/DoneDiagram";
import StreakDiagram from "../../pages/HabitPage/components/Stats/Diagrams/StreakDiagram";
import BreakDiagram from "../../pages/HabitPage/components/Stats/Diagrams/BreakDiagram";
import { groups,metrics,periods } from "../../pages/HabitPage/utils/filters";
import "../../pages/HabitPage/scss/Diagrams.scss";
export default function HabitStatisticsCharts(){
    const {t}=useTranslation("common");
    const {blackout}=useBlackout();
    const initial=blackout.options?.name;
    const [slide,setSlide]=useState(initial==="streak" || initial==="break"?initial:"comp");
    const [period,setPeriod]=useState(periods[0].value),[metric,setMetric]=useState(metrics[0].value),[group,setGroup]=useState(groups[0].value);
    const mainRef=useRef<HTMLDivElement>(null);
    useEffect(()=>{if(period==="thirty" || period==="week")setGroup("day");},[period]);
    return <div className="addHabitDiv addPlanDiv habitStatisticsCharts" ref={mainRef}>
        <h2>{t("statsUi.charts")}</h2>
        <div className="activityPeriodRanges chartModalTabs">{["comp","streak","break"].map(value=><button key={value} type="button" aria-pressed={slide===value} onClick={()=>setSlide(value)}>{t("statsUi.cards."+value)}</button>)}</div>
        <StatsFilters period={period} setPeriod={setPeriod} metric={metric} setMetric={setMetric} group={group} setGroup={setGroup} slide={slide}/>
        {slide==="comp" && <DoneDiagram mainRef={mainRef} period={period} metric={metric} group={group}/>}
        {slide==="streak" && <StreakDiagram mainRef={mainRef} period={period} group={group}/>}
        {slide==="break" && <BreakDiagram mainRef={mainRef} period={period} group={group}/>}
    </div>;
}
