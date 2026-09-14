import { useRef, type ElementType } from "react"
import "../../scss/selector.scss"

interface selectorArr<T extends string | number> {
    label: string,
    icon?: ElementType,
    func: (value: T) => void,
    value:T
}
export default function Selector<T extends string | number>({arr, selected}:{arr:selectorArr<T>[], selected:T}) {
    const selectedRef = useRef<HTMLDivElement | null>(null)
    const width = 100 / arr.length
    const index = arr.findIndex(i => i.value === selected)
    return (
        <div className="selector">
            <div className="selectedItem" ref={selectedRef} style={{width:`${width}%`, left:`${width * index}%`}}/>
            {arr.map((i, n) => (
                <div className="selectorElement"
                    style={{width:`${width}%`}}
                    onClick={() => {
                        i.func(i.value)
                    }} 
                    key={n}
                >
                    <span className={`selectorSpan ${i.value === selected ? "chosen" : ""}`}>{i.icon ? <i.icon size={20} weight="fill"/> : ""}{i.label}</span>
                </div>
            ))}
        </div>
    )
}