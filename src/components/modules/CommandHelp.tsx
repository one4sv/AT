import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
import "../../scss/entitySuggestionList.scss";
export default function CommandHelp() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const saved = blackout.options?.text === "saved";
    const commands = [
        ...(saved ? [["/act", "quickCommands.createActivity"], ["/do", "quickCommands.createPlan"], ["/todo", "createGoalCommand"], ["/set", "localSettingsCommand"]] : []),
        ["/habit", "shareActivity"], ["/plan", "sharePlan"], ["/user", "shareUser"], ["/post", "sharePost"],
        ...(!saved ? [["/group", "shareGroup"], ["/invite", "shareInvite"]] : []),
        ["/settings", "shareSettingsCommand"], ["/help", "commandHelp"]
    ];
    return <ConfirmActionLayout title={t("chatUi.commandHelp")} actions={<button type="button" onClick={() => setBlackout({seted:false})}>{t("chatUi.quickCommands.close")}</button>}>
        <div className="commandHelpList">{commands.map(([command, key]) => <div key={command}><strong>{command}</strong><span>{t("chatUi." + key)}</span></div>)}</div>
    </ConfirmActionLayout>;
}
