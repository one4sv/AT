import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
import "../../scss/entitySuggestionList.scss";

export default function CommandHelp() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const [expanded, setExpanded] = useState<string | null>(null);
    const saved = blackout.options?.text === "saved";
    const commands = [
        ...(saved ? [["/act", "quickCommands.createActivity"], ["/do", "quickCommands.createPlan"], ["/todo", "createGoalCommand"], ["/set", "localSettingsCommand"]] : []),
        ["/goal", "shareGoal"], ["/habit", "shareActivity"], ["/plan", "sharePlan"], ["/user", "shareUser"], ["/post", "sharePost"],
        ...(!saved ? [["/group", "shareGroup"], ["/invite", "shareInvite"]] : []),
        ["/settings", "shareSettingsCommand"], ["/help", "commandHelp"]
    ];
    return <ConfirmActionLayout title={t("chatUi.commandHelp")} actions={<button type="button" onClick={() => setBlackout({seted:false})}>{t("chatUi.quickCommands.close")}</button>}>
        <div className="commandHelpList">{commands.map(([command, key]) => {
            const id = command.slice(1);
            const prefix = "chatUi.commandHelpDetails." + id;
            const open = expanded === id;
            const examples = t(prefix + ".examples", { returnObjects: true });
            return <div key={command} className="commandHelpEntry">
                <button type="button" className="commandHelpRow" aria-expanded={open} aria-controls={"commandHelp-" + id}
                    onClick={() => setExpanded(previous => previous === id ? null : id)}>
                    <strong>{command}</strong><span>{t("chatUi." + key)}</span><CaretDownIcon className={open ? "open" : ""} size={18}/>
                </button>
                {open && <div id={"commandHelp-" + id} className="commandHelpDetails">
                    <div className="commandHelpLabel">{t("chatUi.commandHelpSyntax")}</div>
                    <code>{t(prefix + ".syntax")}</code>
                    <p>{t(prefix + ".body")}</p>
                    <div className="commandHelpLabel">{t("chatUi.commandHelpExamples")}</div>
                    {Array.isArray(examples) && examples.map((example, index) => <code key={index}>{String(example)}</code>)}
                </div>}
            </div>;
        })}</div>
    </ConfirmActionLayout>;
}
