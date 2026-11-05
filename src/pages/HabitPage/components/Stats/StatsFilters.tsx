import SelectList from "../../../../components/ts/SelectList"
import { useTranslation } from "react-i18next"
import { periods, groups, metrics, metricsWid } from "../../utils/filters"
import "../../scss/filters.scss"
import { useParams } from "react-router-dom"
import type { SetStateAction } from "react"

export default function StatsFilters ({ period, setPeriod, metric, setMetric, group, setGroup, slide } : {group: string, period:string, metric: string, setPeriod:React.Dispatch<SetStateAction<string>>, setGroup:React.Dispatch<SetStateAction<string>>, setMetric:React.Dispatch<SetStateAction<string>>, slide:string}) {
    const { habitId: id } = useParams<{ habitId: string }>()
    const { t } = useTranslation("common")
    const localized = (options: { label: string; value: string }[], section: string) =>
        options.map(option => ({ ...option, label: t(`statsUi.${section}.${option.value}`) }))
    
    return (
        <div className="statsDivFilters">
            <SelectList arr={localized(periods, "periods")} className="statsFilter" selected={period} onChange={setPeriod} id="statsFF"/>
            {slide === "comp" && <SelectList arr={localized(id ? metricsWid : metrics, "filters")} className="statsFilter" selected={metric} onChange={setMetric} id="statsFM"/>}
            <SelectList arr={localized(groups, "groups")} className="statsFilter" selected={group} onChange={setGroup} id="statsFG" showOnly={period === "week" || period === "thirty"}/>
        </div>
    )
}