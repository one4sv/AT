import { useTranslation } from "react-i18next";
import { PlusIcon, TargetIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useGoalsWorkspace,goalsChanged } from "../hooks/useGoalsWorkspace";
import { useNote } from "../hooks/NoteHook";
import { useHabits } from "../hooks/HabitsHook";
import { useUser } from "../hooks/UserHook";
import { isGoalHabitAvailable } from "../ts/utils/goalLinkAvailability";
import { api } from "../ts/api";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "./scss/goalWorkspace.scss";

export default function GoalPicker() {
    const {t}=useTranslation("goals");
    const {blackout,setBlackout}=useBlackout();
    const {goals,loading,error}=useGoalsWorkspace();
    const {showNotification}=useNote();
    const habitId=Number(blackout.options?.habitId);
    const {habits,loadingHabits}=useHabits();
    const {user}=useUser();
    const eligible=habits?.some(h=>String(h.id)===String(habitId) && isGoalHabitAvailable(h,user.id));
    const choose=async(goalId:number)=>{
        if(!eligible) return;
        try{
            const response=await api.post("goal-workspace/"+goalId+"/links",{kind:"habit",id:habitId});
            if(!response.data?.success) throw new Error("Link failed");
            goalsChanged();
            setBlackout({seted:false});
            showNotification("success",t("updated"));
        }catch{showNotification("error",t("saveError"));}
    };
    return <div className="addHabitDiv addPlanDiv goalWorkspaceModal goalPicker">
        <h2>{t("selectGoal")}</h2>
        {!loadingHabits && !eligible && <small>{t("inactiveLink")}</small>}
        <button type="button" className="goalWorkspaceQuiet" disabled={!eligible} onClick={()=>
            setBlackout({seted:true,module:"AddGoal",options:{habitId:String(habitId)}})}>
            <PlusIcon size={20}/>{t("createForHabit")}
        </button>
        {loading || loadingHabits ? <span>{t("loading")}</span> : error ? <span>{t("loadError")}</span> :
            !goals.length ? <span>{t("empty")}</span> :
            <div className="goalCatalogList">{goals.map(goal=><button type="button" key={goal.id}
                className="goalPickerItem" disabled={!eligible} onClick={()=>void choose(goal.id)}>
                <TargetIcon size={20}/>
                <span>{goal.name}</span>
                <small>{goal.progress}%</small>
            </button>)}</div>}
    </div>;
}
