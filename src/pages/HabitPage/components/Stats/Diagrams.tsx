import StatsMenu from "./StatsMenu";
import StatsFilters from "./StatsFilters";
import "../../scss/Diagrams.scss"
// import CircleDiagram from "./Diagrams/CircleDiagram";
// import ColumnDiagram from "./Diagrams/ColumnDiagram";
import LineDiagram from "./Diagrams/LineDiagram";
import { useDiagrams } from "../../../../components/hooks/DiagramHook";
import { useEffect, useMemo, useRef } from "react";

export default function Diagrams() {
    const { diagram, view } = useDiagrams()

    const progRef = useRef<HTMLDivElement>(null!);
    const streakRef = useRef<HTMLDivElement>(null!);
    const timerRef = useRef<HTMLDivElement>(null!);

    const refMap = useMemo<Record<string, React.RefObject<HTMLDivElement>>>(() => ({
        comp: progRef,
        streak: streakRef,
        timer: timerRef,
    }), []);

    useEffect(() => {
        if (diagram) {
            const ref = refMap[diagram];
            if (ref?.current) {
                ref.current.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [diagram, refMap])

    return (
        <div className="statsDivStats">
            <StatsMenu/>
            <div className="statsDivWrapper">
                <div className="statsDivSlider">
                    <div className="statsDivSlide" ref={progRef}>
                        <StatsFilters/>
                        {/* {view === "column" && (
                            <ColumnDiagram/>
                        )}
                        {view === "circle" &&(
                            <CircleDiagram/>
                        )}                         */}
                        {view === "line" &&(
                            <LineDiagram/>
                        )}
                    </div>
                    <div className="statsDivSlide" ref={streakRef}>
                    </div>
                    <div className="statsDivSlide" ref={timerRef}>
                    </div>
                </div>
            </div>
        </div>
    )
} 