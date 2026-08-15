import SelectList from "../../../../components/ts/SelectList"
import { periods, groups, metrics, metricsWid } from "../../utils/filters"
import "../../scss/filters.scss"
import { useParams } from "react-router-dom"
import type { SetStateAction } from "react"

export default function StatsFilters ({ period, setPeriod, metric, setMetric, group, setGroup, slide } : {group: string, period:string, metric: string, setPeriod:React.Dispatch<SetStateAction<string>>, setGroup:React.Dispatch<SetStateAction<string>>, setMetric:React.Dispatch<SetStateAction<string>>, slide:string}) {
    const { habitId: id } = useParams<{ habitId: string }>()
    
    return (
        <div className="statsDivFilters">
            <SelectList arr={periods} className="statsFilter" selected={period} onChange={setPeriod} id="statsFF"/>
            {slide === "comp" && <SelectList arr={id ? metricsWid : metrics} className="statsFilter" selected={metric} onChange={setMetric} id="statsFM"/>}
            <SelectList arr={groups} className="statsFilter" selected={group} onChange={setGroup} id="statsFG" showOnly={period === "week" || period === "thirty"}/>
        </div>
    )
}