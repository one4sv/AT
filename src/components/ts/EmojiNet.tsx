import { RadioButtonIcon } from "@phosphor-icons/react";
import "../../scss/emojiNet.scss"

export default function EmojiNet({
    list,
    val,
    newVal,
    id
}: {
    list: { label: string; value: string }[];
    val: string;
    newVal?:(val:string) => void;
    id:string
}) {
    return (
        <div className="emojiNet" data-setting-id={id}>
            {list.map((el) => {
                const active = el.value === val
                return (
                    <div key={el.value} className={`radiobutt emojiNetButt ${active ? "active" : ""}`} onClick={() => newVal && newVal(el.value)}>
                        <RadioButtonIcon weight="fill"/>
                        <span>{el.label}</span>
                    </div>
                )
            }
            )}
        </div>
    );
}