import { XIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import "../../scss/clearTimeButton.scss";

export default function ClearTimeButton({label,onClear,disabled}: {label:string;onClear:()=>void;disabled?:boolean}) {
    const {t}=useTranslation("common");
    return <button type="button" className="clearOptionalTime" disabled={disabled}
        aria-label={t("habitUi.clearTime")+" · "+label}
        onClick={event=>{event.preventDefault();onClear();}}><XIcon size={18}/></button>;
}
