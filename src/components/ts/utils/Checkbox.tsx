import type { SetStateAction } from "react"
import "../../../scss/Checkbox.scss"
interface checkboxProps {
    state:boolean,
    setState?:React.Dispatch<SetStateAction<boolean>>,
    func?:(val:boolean) => void,
    funcNoVal?:() => void,
    disable:boolean
}
export default function Checkbox({state, setState, func, funcNoVal, disable}:checkboxProps) {
    return (
        <div className={`checkbox ${disable ? "disabled" : ""}`} onClick={() => {
            if (disable) return
            if (func) func(!state)
            if (setState) setState(!state)
            if (funcNoVal) funcNoVal()
        }}>
            {state && (
                <div className={`checkboxTrue ${disable ? "disabled" : ""}`} style={{display:state ? "inline-block" : "none"}}></div>
            )}
        </div>
    )
}