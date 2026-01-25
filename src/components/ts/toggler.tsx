import type { Dispatch, SetStateAction } from "react"
import "../../scss/toggler.scss"
export interface TogglerProps {
    state: boolean;
    disable?: boolean;
    setState?: Dispatch<SetStateAction<boolean>> | ((val: boolean) => void);
    onToggle?: (newState: boolean) => void;
    stopPropagation?: boolean
}
export default function Toggler({state, disable, setState, onToggle, stopPropagation}:TogglerProps) {
    if (!stopPropagation) stopPropagation = false
    const switchToggler = () => {
        const newState = !state;
        setState?.(newState);
        onToggle?.(newState);
    };

    return (
        <div
            className={`toggler ${state ? "true" : "false"} ${disable ? "disable" : ""}`}
            onClick={(e) => {
                e.preventDefault();
                if (stopPropagation) e.stopPropagation()
                if (!disable) {
                    switchToggler();
                }
            }}
        >
            <div className="togglerCircle"></div>
        </div>
    );
}