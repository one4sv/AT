import { RadioButtonIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import ReactionIcon from "./ReactionIcon";
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
    const { t } = useTranslation("common");
    return (
        <div className="emojiNet" data-setting-id={id}>
            {list.map((el) => {
                const active = el.value === val
                return (
                    <div key={el.value} className={`radiobutt emojiNetButt ${active ? "active" : ""}`} title={t(`reactions.${el.value}`)} onClick={() => newVal && newVal(el.value)}>
                        <RadioButtonIcon weight="fill"/>
                        <span><ReactionIcon value={el.value} size={20} /></span>
                    </div>
                )
            }
            )}
        </div>
    );
}