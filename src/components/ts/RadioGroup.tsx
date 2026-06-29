import { RadioButtonIcon } from "@phosphor-icons/react";
import "../../scss/radioGroup.scss"

export default function RadioGroup({
    list,
    val,
    newVal
}: {
    list: { label: string; value: string }[];
    val: string;
    newVal?:(val:string) => void
}) {
    return (
        <div className="radioGroup">
            {list.map((el) => {
                const active = el.value === val
                return (
                    <div key={el.value} className={`radiobutt ${active ? "active" : ""}`} onClick={() => newVal && newVal(el.value)}>
                        <RadioButtonIcon weight="fill"/>
                        <span>{el.label}</span>
                    </div>
                )
            }
            )}
        </div>
    );
}