import { createContext, useRef, useState, type ReactNode, type RefObject, type SetStateAction } from "react";
import { filters, groups, metrics, views } from "../../pages/HabitPage/utils/filters";

const DiagramsContext = createContext<DiagramsContextType | null>(null);

export interface DiagramsContextType {
    filter:string,
    setFilter: React.Dispatch<SetStateAction<string>>,
    view:string,
    setView: React.Dispatch<SetStateAction<string>>,
    metric:string,
    setMetric: React.Dispatch<SetStateAction<string>>,
    group:string,
    setGroup: React.Dispatch<SetStateAction<string>>,
    diagram:string,
    setDiagram:React.Dispatch<SetStateAction<string>>,
    mainRef: RefObject<HTMLDivElement | null>
} 

export const DiagramsProvider = ({ children }: { children: ReactNode }) => {
    const [ diagram, setDiagram ] = useState("comp")
    const [ filter, setFilter ] = useState(filters[0].value)
    const [ view, setView ] = useState(views[0].value)
    const [ metric, setMetric ] = useState(metrics[0].value)
    const [ group, setGroup ] = useState(groups[0].value)
    const mainRef = useRef<HTMLDivElement>(null)

    return (
        <DiagramsContext.Provider value={{ 
            diagram, setDiagram, filter, setFilter, view,
            setView, metric, setMetric, group, setGroup, mainRef
        }}>
            {children}
        </DiagramsContext.Provider>
    );
};

export default DiagramsContext
