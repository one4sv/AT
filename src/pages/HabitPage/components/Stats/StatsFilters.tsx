import SelectList from "../../../../components/ts/SelectList"
import { periods, groups, metrics, metricsWid } from "../../utils/filters"
import "../../scss/filters.scss"
import { useDiagrams } from "../../../../components/hooks/DiagramHook"
import { useParams } from "react-router-dom"

export default function StatsFilters () {
    const { period, setPeriod, metric, setMetric, group, setGroup } = useDiagrams()
    const { habitId: id } = useParams<{ habitId: string }>()
    
    return (
        <div className="statsDivFilters">
            <div className="statsDivSL">
                <label htmlFor="statsFF">Период:</label>
                <SelectList arr={periods} className="statsFilter" selected={period} onChange={setPeriod} id="statsFF"/>
            </div>
            <div className="statsDivSL">
                <label htmlFor="statsFM">Метрика:</label>
                <SelectList arr={id ? metricsWid : metrics} className="statsFilter" selected={metric} onChange={setMetric} id="statsFM"/>
            </div>
            <div className="statsDivSL">
                <label htmlFor="statsFG">Группировать:</label>
                <SelectList arr={groups} className="statsFilter" selected={group} onChange={setGroup} id="statsFG" showOnly={period === "week" || period === "thirty"}/>
            </div>
        </div>
    )
}