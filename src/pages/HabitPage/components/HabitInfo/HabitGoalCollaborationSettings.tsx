import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useNote } from "../../../../components/hooks/NoteHook";
import { goalsChanged } from "../../../../components/hooks/useGoalsWorkspace";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { api } from "../../../../components/ts/api";
import "../Overview/goalLocale";

export default function HabitGoalCollaborationSettings({isOwner}: {isOwner:boolean}) {
    const {t}=useTranslation("goals");
    const {habit,loadHabit}=useTheHabit();
    const {refetchHabits}=useHabits();
    const {showNotification}=useNote();
    const [saving,setSaving]=useState(false);
    if(!habit)return null;
    const scope=habit.goal_scope || "personal";
    const completion=habit.goal_completion_mode || "shared";
    const update=async(field:"goal_scope" | "goal_completion_mode",value:string)=>{
        if(!isOwner || saving || !["personal","shared"].includes(value))return;
        setSaving(true);
        try{
            const {data}=await api.patch("habits/"+habit.id+"/collaboration",{[field]:value});
            if(!data.success)throw new Error("Unable to save collaboration mode");
            await Promise.all([loadHabit(String(habit.id)),refetchHabits()]);
            goalsChanged();
        }catch{showNotification("error",t("saveError"));}
        finally{setSaving(false);}
    };
    return <>
        <div className="privateSLWrapper">
            <div className="settingSpan">{t("activityGoals")}</div>
            {isOwner?<RadioGroup id="goal_scope" val={scope} disabled={saving} list={[
                {label:t("scopePersonal"),value:"personal"},{label:t("scopeShared"),value:"shared"}
            ]} newVal={value=>void update("goal_scope",value)}/>:<div className="habitSettingValue">{t(scope==="shared"?"scopeShared":"scopePersonal")}</div>}
            <small className="habitSettingHint">{t(scope==="shared"?"scopeSharedHint":"scopePersonalHint")}</small>
        </div>
        {scope==="shared" && <div className="privateSLWrapper">
            <div className="settingSpan">{t("sharedCompletion")}</div>
            {isOwner?<RadioGroup id="goal_completion_mode" val={completion} disabled={saving} list={[
                {label:t("completionShared"),value:"shared"},{label:t("completionPersonal"),value:"personal"}
            ]} newVal={value=>void update("goal_completion_mode",value)}/>:<div className="habitSettingValue">{t(completion==="shared"?"completionShared":"completionPersonal")}</div>}
            <small className="habitSettingHint">{t(completion==="shared"?"completionSharedHint":"completionPersonalHint")}</small>
        </div>}
    </>;
}
