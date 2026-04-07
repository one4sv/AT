import StatsFilters from "./StatsFilters";
import "../../scss/Diagrams.scss"
import LineDiagram from "./Diagrams/LineDiagram";
import { useDiagrams } from "../../../../components/hooks/DiagramHook";
import { useEffect, useRef } from "react";
import { slides } from "../../utils/filters";
import OverallStats from "./Diagrams/OverallStats";

export default function Diagrams() {
    const { diagram, setDiagram, view } = useDiagrams();
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sliderRef.current || !diagram) return;
        const index = slides.findIndex(s => s.value === diagram) ?? 0;
        const offset = index === -1 ? 0 : index * (100 / slides.length);

        sliderRef.current.style.transform = `translateY(-${offset}%)`;
    }, [diagram]);

    return (
        <div className="statsDivStats">
            <div className="statsMenu">
                {slides.map((s) => (
                    <div className={`statsMenuButt ${diagram === s.value ? "active" : ""}`} onClick={() => setDiagram(s.value)} key={s.value}>
                        {s.label}
                    </div>      
                ))}
            </div>
            <div className="statsDivWrapper">
                <div className="statsDivSlider" ref={sliderRef}>
                    <div className="statsDivSlide">
                        <StatsFilters/>
                        {view === "line" && <LineDiagram/>}
                    </div>
                    <div className="statsDivSlide">
                        <OverallStats/>
                    </div>

                    <div className="statsDivSlide">
                    </div>
                </div>
            </div>
        </div>
    );
}