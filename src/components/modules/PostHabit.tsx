import { useRef, useState } from "react";
import { ArrowLeftIcon, ProhibitIcon, TargetIcon, CalendarBlankIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useHabits } from "../hooks/HabitsHook";
import { usePlans } from "../hooks/PlansHook";
import { useGoalsWorkspace } from "../hooks/useGoalsWorkspace";
import { useUser } from "../hooks/UserHook";
import type { PostLinks } from "../context/BlackoutContext";
import { goalIsCurrent } from "../../pages/HabitPage/components/Overview/goalTypes";
import { isPastSideMenuPlan } from "../ts/utils/dayTimeline";
import { habitIcon } from "../ts/habitIcon";
import { tags } from "../ts/tags";
import { planAvatarUrl } from "../ts/utils/activityImage";
import { formatDateFromString } from "../ts/utils/dateToStr";
import { formatHabitTime } from "../ts/utils/formatHabitTime";
import "../../scss/SM/habitsList.scss";
import "./scss/PostSettings.scss";

const tabs = ["habit","goal","plan"] as const;
type Tab = typeof tabs[number];
interface PostHabitProps {
    selected: PostLinks;
    onSelect: (value: PostLinks) => void;
    onBack: () => void;
}
export default function PostHabit({selected,onSelect,onBack}:PostHabitProps){
    const {t}=useTranslation("acc");
    const {t:settingsT}=useTranslation("settings");
    const {habits,loadingHabits}=useHabits();
    const {plans,loadingPlans}=usePlans();
    const {goals,loading:loadingGoals,error:goalsError}=useGoalsWorkspace();
    const {user}=useUser();
    const [search,setSearch]=useState("");
    const [filter,setFilter]=useState("all");
    const [tab,setTab]=useState<Tab>("habit");
    const slider=useRef<HTMLDivElement>(null);
    const current=goals.find(g=>String(g.id)===selected.goal);
    const habitIds=current?.habit_ids ?? current?.habits?.map(h=>h.id) ?? [];
    const planIds=current?.plan_ids ?? current?.plans?.map(p=>p.id) ?? [];
    const matches=(name:string)=>name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    const category=(shared:boolean)=>filter==="all" || (filter==="shared"?shared:!shared);
    const chosen=(kind:Tab)=>selected[kind]!=="none";
    const linked=(ids:number[],id:string)=>ids.some(value=>String(value)===id);
    const change=(kind:Tab,id:string)=>{
        if(id==="none" || selected[kind]===id){
            // Without the connecting goal, keep the activity; the plan can be selected again separately.
            onSelect({...selected,[kind]:"none",...(kind==="goal" && chosen("habit") && chosen("plan")?{plan:"none"}:{})});
        }else onSelect({...selected,[kind]:id});
    };
    const activityRows=(habits || []).filter(h=>h.ongoing && matches(h.name) && category(Boolean(h.chat_id || h.user_id!==user.id)) &&
        (chosen("goal")?linked(habitIds,String(h.id)):!chosen("plan")));
    const goalRows=goals.filter(g=>goalIsCurrent(g) && matches(g.name) && category(Boolean(g.shared_habit_id)) &&
        (!chosen("habit") || linked(g.habit_ids ?? g.habits?.map(h=>h.id) ?? [],selected.habit)) &&
        (!chosen("plan") || linked(g.plan_ids ?? g.plans?.map(p=>p.id) ?? [],selected.plan)));
    const planRows=plans.filter(p=>p.membership_status!=="pending" && p.status!=="canceled" && !isPastSideMenuPlan(p) && matches(p.name) && category(p.kind==="shared") &&
        (chosen("goal")?linked(planIds,String(p.id)):!chosen("habit")));
    const row=(kind:Tab,id:string,name:string,icon:React.ReactNode,detail?:string)=><button key={kind+id} type="button" className={"habit postLinkRow"+(selected[kind]===id?" active":"")} aria-pressed={selected[kind]===id} onClick={()=>change(kind,id)}>
        <div className="habitIcon">{icon}</div>
        <div className="habitInfo"><div className="habitName"><span className="habitNameText">{name}</span></div><div className="habitPer">{detail}</div></div>
        {selected[kind]===id && <CheckCircleIcon size={22} weight="fill" className="postLinkCheck"/>}
    </button>;
    const none=(kind:Tab)=>row(kind,"none",t("editor.noLink"),<ProhibitIcon className="habitIconSvg"/>);
    const setSlide=(value:Tab)=>{
        setTab(value);
        const element=slider.current;
        if(element)element.scrollTo({left:tabs.indexOf(value)*element.clientWidth,behavior:"smooth"});
    };
    const selectedName=(kind:Tab)=>kind==="habit"?habits?.find(h=>String(h.id)===selected.habit)?.name:kind==="goal"?current?.name:plans.find(p=>String(p.id)===selected.plan)?.name;
    return <div className="postSettingsDiv settingInnerDiv postLinkPicker" role="dialog" aria-modal="true" aria-labelledby="postHabitTitle">
        <div className="postSettingsHeader">
            <div className="settingHeader" id="postHabitTitle">{t("editor.habit")}</div>
            <button type="button" onClick={onBack} aria-label={t("navigation.back",{ns:"info"})}><ArrowLeftIcon/></button>
        </div>
        <input className="postHabitSearch" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={settingsT("quickFilters.search")}/>
        <div className="postHabitFilters postLinkTabs" role="tablist">
            {tabs.map(value=><button key={value} type="button" role="tab" aria-selected={tab===value} className={tab===value?"active":""} onClick={()=>setSlide(value)}>{t("editor.linkTab."+value)}{chosen(value)?" · 1":""}</button>)}
        </div>
        <div className="postHabitFilters">
            {["all","mine","shared"].map(value=><button key={value} type="button" className={filter===value?"active":""} onClick={()=>setFilter(value)}>{settingsT("quickFilters."+value)}</button>)}
        </div>
        {tabs.some(chosen) && <div className="postLinkSelected">{tabs.filter(chosen).map(kind=><button key={kind} type="button" onClick={()=>change(kind,"none")}>{selectedName(kind) || t("editor.linkTab."+kind)} ×</button>)}</div>}
        <div className="postLinkSlider" ref={slider} onScroll={e=>{const element=e.currentTarget;setTab(tabs[Math.max(0,Math.min(2,Math.round(element.scrollLeft/element.clientWidth)))] || "habit");}}
            onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()} onTouchCancel={e=>e.stopPropagation()}>
            <div className="postHabitList postLinkSlide" role="tabpanel" inert={tab!=="habit"}>
                {none("habit")}
                {chosen("plan") && !chosen("goal") && <div className="settingHint">{t("editor.linkChooseGoal")}</div>}
                {loadingHabits && <div className="settingHint">{t("post.loading")}</div>}
                {activityRows.map(h=>row("habit",String(h.id),h.name,habitIcon(h),formatHabitTime(h)))}
            </div>
            <div className="postHabitList postLinkSlide" role="tabpanel" inert={tab!=="goal"}>
                {none("goal")}
                {loadingGoals && <div className="settingHint">{t("post.loading")}</div>}
                {goalsError && <div className="settingHint">{t("post.loadFailed")}</div>}
                {goalRows.map(g=>row("goal",String(g.id),g.name,<TargetIcon className="habitIconSvg"/>,g.progress+"%"))}
            </div>
            <div className="postHabitList postLinkSlide" role="tabpanel" inert={tab!=="plan"}>
                {none("plan")}
                {chosen("habit") && !chosen("goal") && <div className="settingHint">{t("editor.linkChooseGoal")}</div>}
                {loadingPlans && <div className="settingHint">{t("post.loading")}</div>}
                {planRows.map(p=>{const Icon=tags.find(item=>item.value===p.tag)?.icon || CalendarBlankIcon;return row("plan",String(p.id),p.name,p.avatar_key?<img className="activityAvatar" src={planAvatarUrl(p.id,p.avatar_key)} alt=""/>:<Icon className="habitIconSvg"/>,formatDateFromString(p.plan_date)+(p.start_time?" · "+p.start_time.slice(0,5):""));})}
            </div>
        </div>
    </div>;
}
