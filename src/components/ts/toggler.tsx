import type { Dispatch, SetStateAction } from "react"
import "../../scss/toggler.scss"
export interface TogglerProps {
    state:boolean,
    disable?:boolean,
    setState?: Dispatch<SetStateAction<boolean>> | ((val: boolean) => void)
}
export default function Toggler({state, disable, setState}:TogglerProps) {
    const switchToggler = () => setState?.(!state)

    return (
        <div className={`toggler ${state ? "true" : "false"} ${disable ? "disable" : ""}`} onClick={(e) => {
            e.preventDefault()
            if (!disable) {
                switchToggler()
            }
        }}>
            <div className="togglerCircle"></div>
        </div>
    )
}