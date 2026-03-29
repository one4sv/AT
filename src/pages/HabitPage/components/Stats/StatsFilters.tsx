import SelectList from "../../../../components/ts/SelectList"
import { filters, groups, metrics } from "../../utils/filters"
import "../../scss/filters.scss"
import { useDiagrams } from "../../../../components/hooks/DiagramHook"

export default function StatsFilters () {
    const { filter, setFilter, metric, setMetric, group, setGroup } = useDiagrams()
    
    return (
        <div className="statsDivFilters">
            <div className="statsDivSL">
                <label htmlFor="statsFF">Период:</label>
                <SelectList arr={filters} className="statsFilter" selected={filter} onChange={setFilter} id="statsFF"/>
            </div>
            {/* <div className="statsDivSL">
                <label htmlFor="statsFV">Диаграмма:</label>
                <SelectList arr={views} className="statsFilter" selected={view} onChange={setView} id="statsFV"/>
            </div>             */}
            <div className="statsDivSL">
                <label htmlFor="statsFM">Метрика:</label>
                <SelectList arr={metrics} className="statsFilter" selected={metric} onChange={setMetric} id="statsFV"/>
            </div>            
            <div className="statsDivSL">
                <label htmlFor="statsFG">Группировать:</label>
                <SelectList arr={groups} className="statsFilter" selected={group} onChange={setGroup} id="statsFV"/>
            </div>
        </div>
    )
}