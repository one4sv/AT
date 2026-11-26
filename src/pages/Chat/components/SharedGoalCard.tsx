import { TargetIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import type { GoalSnapshot } from "../utils/sharedGoal";
import "../scss/SharedEntityCard.scss";
export default function SharedGoalCard({goal,href}:{goal:GoalSnapshot;href:string}) {
    const {t}=useTranslation("common");
    const {setBlackout}=useBlackout();
    const {openMenu}=useContextMenu();
    const open=()=>setBlackout({seted:true,module:"SharedGoalPreview",options:{url:href}});
    return <div className="sharedEntityCard sharedWallpaperCard" data-context-menu="true" onContextMenu={event=>{event.preventDefault();event.stopPropagation();openMenu(event.clientX,event.clientY,"sharedSetting",{id:"goal",url:href,name:goal.name,onOpen:open});}}>
        <button type="button" className="sharedEntityLink" onClick={event=>{event.stopPropagation();open();}}><span className="sharedEntityIcon"><TargetIcon size={24}/></span><span className="sharedEntityInfo"><span className="sharedEntityName">{goal.name}</span><span className="sharedEntityDetails">{t("chatUi.goalObject")} · {goal.progress}%</span></span></button>
    </div>;
}
