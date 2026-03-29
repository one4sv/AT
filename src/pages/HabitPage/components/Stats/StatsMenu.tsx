import { useDiagrams } from "../../../../components/hooks/DiagramHook"

export default function StatsMenu() {
    const { setDiagram, diagram } = useDiagrams()

    return (
        <div className="statsMenu">
            <div className={`statsMenuButt ${diagram === "comp" ? "active" : ""}`} onClick={() => setDiagram("comp")}>
                Прогресс
            </div>            
            <div className={`statsMenuButt ${diagram === "streak" ? "active" : ""}`} onClick={() => setDiagram("streak")}>
                Серия
            </div>            
            <div className={`statsMenuButt ${diagram === "timer" ? "active" : ""}`} onClick={() => setDiagram("timer")}>
                Таймер/счётчик
            </div>
        </div>
    )
}