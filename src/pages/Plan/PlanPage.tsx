import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarBlankIcon, ClockIcon, MapPinIcon, CheckCircleIcon, CircleIcon, TrashIcon, PencilSimpleIcon, CheckIcon, CameraIcon } from "@phosphor-icons/react";
import { api } from "../../components/ts/api";
import { usePlans } from "../../components/hooks/PlansHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useContextMenu } from "../../components/hooks/ContextMenuHook";
import type { MenuOptions } from "../../components/context/ContextMenuContext";
import type { OneOffPlan } from "../../components/context/PlansContext";
import PlanEditor, { type PlanInput } from "./PlanEditor";
import ClearTimeButton from "../../components/ts/ClearTimeButton";
import CalendarInput from "../../components/ts/CalendarInput";
import TA from "../../components/ts/TA";
import TagSelector from "../../components/ts/TagSelector";
import RadioGroup from "../../components/ts/RadioGroup";
import Skeleton from "../../components/ts/Skeleton";
import { relativePlanDay } from "../../components/ts/utils/dateToStr";
import PlanReminders from "./PlanReminders";
import PlanComment from "./PlanComment";
import PlanMembers from "./PlanMembers";
import { prepareActivityImage, planAvatarUrl } from "../../components/ts/utils/activityImage";
import "../../scss/activityImages.scss";
import { tags } from "../../components/ts/tags";
import useCompactLayout from "../../components/hooks/utils/useCompactLayout";
import { useSettings } from "../../components/hooks/SettingsHook";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import "./scss/PlanPage.scss";

export default function PlanPage() {
    const { planId } = useParams<{ planId: string }>();
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { search, pathname } = useLocation();
    const { setBlackout } = useBlackout();
    const isCompact = useCompactLayout();
    const [mobileOpen, setMobileOpen] = useState<"done" | "comment">("done");
    const { plans, pendingPlans, setCompleted, writePlan, refreshPlans } = usePlans();
    const { privateShow } = useSettings();
    const { setTitle, setTitleIcon, setHeaderMenu } = usePageTitle();
    const { openMenu } = useContextMenu();
    const [confirmedPlan, setPlan] = useState<OneOffPlan | null>(null);
    const plan = confirmedPlan && pendingPlans[confirmedPlan.id] ? {...confirmedPlan,...pendingPlans[confirmedPlan.id]} : confirmedPlan;
    const [loading, setLoading] = useState(Boolean(planId));
    const [saving, setSaving] = useState(false);
    const [avatarBusy,setAvatarBusy] = useState(false);
    const avatarInput=useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState(!planId);
    const [draft, setDraft] = useState<PlanInput | null>(null);
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    useEffect(() => {
        if (!plan || !plan.is_owner || plan.status !== "upcoming" ||
            !new URLSearchParams(search).has("invite")) return;
        setBlackout({ seted: true, module: "HabitParticipantPicker",
            point: "plan", options: { id: String(plan.id), name: plan.name } });
        const params = new URLSearchParams(search);
        params.delete("invite");
        navigate({ pathname, search: params.toString() ? "?" + params.toString() : "" }, { replace: true });
    }, [plan?.id, plan?.is_owner, plan?.status, search, pathname, navigate, setBlackout]);

    useEffect(() => {
        setMobileOpen("done");
        setEditing(!planId);
        setDraft(null);
        setPlan(null);
        setError("");
        setConfirmDelete(false);
    }, [planId]);
    const loadVersion=useRef(0);
    const load = async (showSkeleton = false) => {
        if (!planId) return;
        const version=++loadVersion.current;
        if (showSkeleton) setLoading(true);
        try {
            const res = await api.get("plans/" + planId, { params: { share: new URLSearchParams(window.location.search).get("share") || undefined } });
            if (!res.data.success) throw new Error();
            if(version!==loadVersion.current) return;
            setPlan(res.data.plan);
            setError("");
        } catch {
            if(version===loadVersion.current) setError(t("plans.loadError"));
        } finally {
            if (version===loadVersion.current) setLoading(false);
        }
    };
    useEffect(() => {
        void load(true);
        return () => { loadVersion.current++; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId, search]);
    useEffect(() => {
        const onMembersUpdated = (event:Event) => {
            const detail = (event as CustomEvent).detail;
            if (detail?.id && String(detail.id) !== planId) return;
            if (detail?.plan) { loadVersion.current++;setPlan(detail.plan);setLoading(false); }
            else void load();
        };
        const onGroupUpdated = () => void load();
        window.addEventListener("groupUpdated", onGroupUpdated);
        window.addEventListener("plan-members-updated", onMembersUpdated);
        window.addEventListener("plan-updated", onMembersUpdated);
        return () => {
            window.removeEventListener("groupUpdated", onGroupUpdated);
            window.removeEventListener("plan-members-updated", onMembersUpdated);
            window.removeEventListener("plan-updated", onMembersUpdated);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId]);
    useEffect(() => {
        setTitle(plan?.name || (planId ? t("plans.title") : t("plans.create")));
    }, [planId, plan?.name, setTitle, t]);
    useEffect(() => {
        const Icon = tags.find(tag => tag.value === plan?.tag)?.icon;
        setTitleIcon(plan?.avatar_key ? <img className="activityAvatar" src={planAvatarUrl(plan.id,plan.avatar_key)} alt=""/> : Icon ? <Icon size={24}/> : null);
        return () => setTitleIcon(null);
    }, [plan?.tag, plan?.avatar_key, plan?.id, search, setTitleIcon]);

    const startEditing = () => {
        if (!plan) return;
        setDraft({
            name: plan.name,
            description: plan.description || "",
            plan_date: plan.plan_date,
            start_time: plan.start_time?.slice(0, 5) || null,
            end_time: plan.end_time?.slice(0, 5) || null,
            timezone: plan.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow",
            place: plan.place || "",
            tag: plan.tag || null,
            kind: plan.kind,
            completion_mode: plan.completion_mode || "personal",
            visibility: plan.visibility || "inherit"
        });
        setEditing(true);
    };
    function changeDraft<K extends keyof PlanInput>(key: K, next: PlanInput[K]) {
        setDraft(previous => previous ? { ...previous, [key]: next } : previous);
    }
    const stopEditing = () => {
        setEditing(false);
        setDraft(null);
    };
    const localDate = (date: Date) => [date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")].join("-");

    const complete = async () => {
        if (!plan || plan.can_complete === false || pendingPlans[plan.id]) return;
        setError("");
        try {
            await setCompleted(plan,!plan.completed_for_me);
        } catch {
            setError(t("plans.saveError"));
        }
    };
    const toggleCancel = async () => {
        if (!plan || saving) return;
        const status = plan.status === "canceled" ? "upcoming" : "canceled";
        setSaving(true);
        setError("");
        try {
            await writePlan(plan.id,{status},async () => {
                const {data} = await api.post("plans/" + plan.id + "/cancel",{cancel:status === "canceled"});
                if (!data.success) throw new Error("Plan not updated");
                setPlan(current => current?.id === plan.id ? {...current,status} : current);
                return {status};
            });
        } catch {
            setError(t("plans.saveError"));
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!planId) return;
        setSaving(true);
        setError("");
        try {
            await api.delete("plans/" + planId);
            await refreshPlans();
            navigate("/habit");
        } catch {
            setError(t("plans.saveError"));
        } finally {
            setSaving(false);
        }
    };
    const save = async (input: PlanInput) => {
        setSaving(true);
        setError("");
        try {
            const payload = {
                ...input,
                ...(planId ? {} : { kind: input.kind }),
            };
            if (planId) {
                const { kind, ...changes } = payload;
                void kind;
                await writePlan(Number(planId),changes,async () => {
                    const result = await api.patch("plans/" + planId, changes);
                    if (!result.data.success) throw new Error();
                    setPlan(current => current?.id === Number(planId) ? {...current,...result.data.plan} : current);
                    return result.data.plan;
                });
                stopEditing();
            } else {
                const result = await api.post("plans", payload);
                if (!result.data.success) throw new Error();
                await refreshPlans();
                navigate("/plan/" + result.data.plan.id, { replace: true });
            }
        } catch {
            setError(t("plans.saveError"));
        } finally {
            setSaving(false);
        }
    };
    const canEditAvatar=Boolean(plan?.is_owner && plan.status!=="canceled");
    const changeAvatar=async(file:File|null)=>{
        if(!plan || !canEditAvatar || avatarBusy || pendingPlans[plan.id])return;
        setAvatarBusy(true);setError("");
        try{
            const body=new FormData();
            if(file)body.append("avatar",await prepareActivityImage(file,true));else body.append("remove","true");
            await writePlan(plan.id,{},async()=>{
                const {data}=await api.put("plans/"+plan.id+"/avatar",body);
                if(!data.success)throw new Error("Avatar not saved");
                const patch={avatar_key:data.avatar_key as string|null};
                loadVersion.current++;
                setPlan(current=>current?.id===plan.id?{...current,...patch}:current);
                return patch;
            });
        }catch{setError(t("activityImages.avatarError"));}finally{setAvatarBusy(false);}
    };
    const openAvatar=(x:number,y:number)=>{
        if(!plan || avatarBusy)return;
        if(!plan.avatar_key){if(canEditAvatar)avatarInput.current?.click();return;}
        const url=planAvatarUrl(plan.id,plan.avatar_key);
        const view=()=>setBlackout({seted:true,module:"ImgPrev",img:url});
        if(!canEditAvatar){view();return;}
        openMenu(x,y,"activityAvatar",{id:String(plan.id),onEdit:()=>avatarInput.current?.click(),onOpen:view,onDelete:()=>setBlackout({seted:true,module:"ConfirmAction",confirmAction:{title:t("activityImages.removeAvatar"),description:t("activityImages.removeAvatar"),label:t("activityImages.removeAvatar"),variant:"danger",run:async()=>{await changeAvatar(null);}}})});
    };
    const selectedTag = tags.find(tag => tag.value === plan?.tag);
    const planPinned = plans.find(item => item.id === plan?.id)?.pinned ?? plan?.pinned ?? false;
    const linkOnly = plan?.visibility === "link" || (plan?.visibility === "inherit" && privateShow.plans === "link");
    const canComplete = !!plan && plan.can_complete !== false && plan.membership_status === "accepted" && plan.status !== "canceled" &&
        (plan.is_owner || plan.completion_mode !== "shared");

    const menuHandlers = useRef({
        edit: startEditing,
        save: () => { if (draft) void save(draft); },
        stop: stopEditing,
        toggleCancel,
        delete: () => {
            setConfirmDelete(true);
            document.querySelector(".planPage")?.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
    menuHandlers.current = {
        edit: startEditing,
        save: () => { if (draft && draft.name.trim() && draft.plan_date && !saving) void save(draft); },
        stop: stopEditing,
        toggleCancel,
        delete: () => {
            setConfirmDelete(true);
            document.querySelector(".planPage")?.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    const makePlanMenuOptions = (id: string, name: string, type: string, owner: boolean): MenuOptions => ({
        id, name, type, isMy: owner, canPin: true, pinned: planPinned, disabled: saving,
        shareToken: plan?.is_owner && linkOnly ? plan.share_token : undefined,
        onEdit: () => menuHandlers.current.edit(),
        onSave: () => menuHandlers.current.save(),
        onStopEdit: () => menuHandlers.current.stop(),
        onToggleCancel: () => menuHandlers.current.toggleCancel(),
        onConfirmDelete: () => menuHandlers.current.delete()
    });
    useEffect(() => {
        if (plan?.membership_status === "accepted" && planId) {
            setHeaderMenu({ point: "plan", options: makePlanMenuOptions(planId, plan.name,
                editing ? "editing" : plan.status || "upcoming", !!plan.is_owner) });
        } else {
            setHeaderMenu(null);
        }
        return () => setHeaderMenu(null);
        // Header callbacks read menuHandlers.current so changing draft text does not rebuild the header.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId, plan?.id, plan?.name, plan?.is_owner, plan?.membership_status, plan?.status, plan?.share_token, plan?.visibility, privateShow.plans, planPinned, editing, saving, setHeaderMenu]);

    const openPlanMenu = (x: number, y: number) => {
        if (plan?.membership_status !== "accepted" || !planId || saving) return;
        openMenu(x, y, "plan", makePlanMenuOptions(planId, plan.name,
            editing ? "editing" : plan.status || "upcoming", !!plan.is_owner));
    };
    const readOnly = !editing || !draft;
    const value = (draft || plan)!;

    return <div className="planPage">
        {error && <div className="planError" role="alert">{error}</div>}
        {loading ? <Skeleton type="plan"/> :
            editing && !plan ? <div className="planSection">
                <h2>{planId ? t("plans.edit") : t("plans.create")}</h2>
                <PlanEditor initial={plan || undefined} saving={saving} onSave={save}
                    onClose={() => planId ? setEditing(false) : navigate("/habit")}/>
            </div> : plan ? <>
                <div className="planSection planMainSection"
                    data-context-menu={plan.membership_status === "accepted" ? "true" : undefined}
                    onContextMenu={event => {
                        if ((event.target as Element).closest(".planAvatarButton") || (editing && (event.target as Element).closest("input, textarea"))) return;
                        if (plan.membership_status === "accepted") {
                            event.preventDefault();
                            openPlanMenu(event.clientX, event.clientY);
                        }
                    }}>
                    <div className="planHeading">
                        <h1 className="planTitleWithIcon">
                            {canEditAvatar && <input ref={avatarInput} type="file" accept="image/*" hidden onChange={event=>{const file=event.target.files?.[0];event.target.value="";if(file)void changeAvatar(file);}}/>}
                            {(plan.avatar_key || canEditAvatar) ? <button type="button" className="planAvatarButton" aria-label={t("plans.avatar")} disabled={avatarBusy} onClick={event=>{event.stopPropagation();const rect=event.currentTarget.getBoundingClientRect();openAvatar(event.clientX || rect.left,event.clientY || rect.bottom);}} onContextMenu={event=>{event.preventDefault();event.stopPropagation();openAvatar(event.clientX,event.clientY);}}>
                                {plan.avatar_key?<img className="activityAvatar" src={planAvatarUrl(plan.id,plan.avatar_key)} alt=""/>:selectedTag?<selectedTag.icon size={26}/>:<CameraIcon size={26}/>}
                            </button> : selectedTag && <selectedTag.icon size={26}/>}
                            <input id="planInlineName" className="planDetailsInput planTitleInput"
                                aria-label={t("plans.name")} maxLength={160} required
                                readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                                value={value.name} onChange={event => changeDraft("name", event.target.value)}/>
                        </h1>
                        <div className="planHeadingActions">
                            {plan.status && plan.status !== "upcoming" && <span className="planStatus">{t("plans." + plan.status)}</span>}
                            {plan.is_owner && plan.status !== "canceled" && <button type="button"
                                className={`planIconButton planHeadingEditButton ${editing ? "planHeadingSaveButton" : ""}`}
                                aria-label={t(editing ? "plans.save" : "plans.edit")}
                                disabled={saving || (editing && (!draft?.name.trim() || !draft.plan_date))}
                                onClick={() => editing ? menuHandlers.current.save() : startEditing()}>
                                {editing ? <CheckIcon size={24} weight="bold"/> : <PencilSimpleIcon size={24} weight="bold"/>}
                            </button>}
                        </div>
                    </div>
                    <div className="planMetadata planDateMetadata">
                        <CalendarBlankIcon size={20}/>
                        <CalendarInput id="planInlineDate" className="planDetailsInput planDetailsDate"
                            readOnly={readOnly} dateFormat="d MMMM yyyy"
                            value={value.plan_date ? new Date(value.plan_date + "T12:00:00") : null}
                            onChange={date => changeDraft("plan_date", date ? localDate(date) : "")}/>
                        {value.plan_date && relativePlanDay(value.plan_date, t) && <span className="planRelativeDate">({relativePlanDay(value.plan_date, t)})</span>}
                    </div>
                    {(plan.start_time || plan.end_time || editing) && <div className="planMetadata planDetailsTimes">
                        <ClockIcon size={20}/>
                        <input id="planInlineStart" aria-label={t("plans.startTime")}
                            className="planDetailsInput" type="time"
                            readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                            value={value.start_time?.slice(0, 5) || ""}
                            onChange={event => changeDraft("start_time", event.target.value || null)}/>
                        {editing && value.start_time && <ClearTimeButton label={t("plans.startTime")}
                            onClear={() => changeDraft("start_time", null)}/>}
                        <span>–</span>
                        <input id="planInlineEnd" aria-label={t("plans.endTime")}
                            className="planDetailsInput" type="time"
                            readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                            value={value.end_time?.slice(0, 5) || ""}
                            onChange={event => changeDraft("end_time", event.target.value || null)}/>
                        {editing && value.end_time && <ClearTimeButton label={t("plans.endTime")}
                            onClear={() => changeDraft("end_time", null)}/>}
                    </div>}
                    {(plan.place || editing) && <div className="planMetadata">
                        <MapPinIcon size={20}/>
                        <input id="planInlinePlace" aria-label={t("plans.place")} className="planDetailsInput"
                            maxLength={500} readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                            placeholder={readOnly ? "" : t("plans.place")}
                            value={value.place} onChange={event => changeDraft("place", event.target.value)}/>
                    </div>}
                    {editing ? <div className="planMetadata planDetailsTag planInlineTag">
                        <TagSelector selectedTag={value.tag || undefined}
                            setSelectedTag={tag => changeDraft("tag", tag || null)}/>
                    </div> : plan.tag && <div className="planMetadata planTag planDetailsTag">
                        {(() => {
                            const tag = tags.find(item => item.value === value.tag);
                            return tag ? <><tag.icon size={20}/>{tag.label}</> : null;
                        })()}
                    </div>}
                    <div className="planMetadata planMetadataVertical">
                        {(plan.description || editing) && 
                            <TA id="planInlineDescription"
                                placeholder="Описание"
                                className="planDetailsInput planDescriptionText planDetailsDescription"
                                aria-label={t("plans.description")} maxLength={1200} minHeight={0} maxHeight={22}
                                readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                                value={value.description || ""}
                                onChange={event => changeDraft("description", event.target.value)}
                            />
                        }
                    </div>
                    {editing && plan.is_owner && <div className="planMetadata planVisibility planMetadataVertical">
                        <div className="settingSpan">{t("plans.visibility")}</div>
                        <RadioGroup id="planDetailVisibility" list={["inherit","nobody","contacts","all","link"].map(mode => ({
                            value:mode,label:t("plans.visibility_" + mode)
                        }))} val={value.visibility || "inherit"} newVal={next => changeDraft("visibility",next as PlanInput["visibility"])}/>
                    </div>}
                    <div className="planMetadata">{t("plans." + plan.kind)}</div>
                    {confirmDelete && plan.is_owner && <div className="planDeleteConfirm">
                        <p>{t("plans.confirmDelete")}</p>
                        <div className="planActions">
                            <button className="planQuietButton" onClick={() => setConfirmDelete(false)}>{t("plans.back")}</button>
                            <button className="planQuietButton planDanger" disabled={saving}
                                onClick={() => void remove()}><TrashIcon size={20}/>{t("plans.delete")}</button>
                        </div>
                    </div>}
                    {plan.membership_status === "accepted" && (!isCompact || plan.kind === "shared") && <div className="planInlineCompletion">
                        <h2>{t("plans.completion")}</h2>
                        {plan.kind === "shared" && (editing && plan.is_owner ?
                            <RadioGroup id="planCompletionMode" list={[
                                { value: "personal", label: t("plans.individualCompletion") },
                                { value: "shared", label: t("plans.sharedCompletion") }
                            ]} val={value.completion_mode || "personal"}
                                disabled={saving || !!plan.completed_count || plan.status === "completed"}
                                newVal={next => changeDraft("completion_mode", next as PlanInput["completion_mode"])}/> :
                            <span className="planCompletionMode">{t("plans." + (value.completion_mode || "personal") + "Completion")}</span>)}
                        {plan.kind === "shared" && plan.completion_mode === "personal" &&
                            <p className="planCompletionProgress">{t("plans.completedParticipants", {
                                done: plan.completed_count || 0, total: plan.participants_count || 1
                            })}</p>}
                        {!isCompact && <>
                            <PlanComment planId={plan.id} disabled={plan.status === "canceled" || plan.can_comment === false}/>
                            {canComplete && <div className="doneButtDiv"><button className={"doneButt planDoneButton " +
                            (plan.completed_for_me ? "dbComp" : "dbMark")}
                            disabled={saving || !!pendingPlans[plan.id]} onClick={() => void complete()}>
                            {plan.completed_for_me ? <CheckCircleIcon size={20} weight="fill"/> : <CircleIcon size={20}/>}
                            {t(plan.completed_for_me ? "plans.undoCompletion" : "habitUi.complete")}
                        </button></div>}
                        </>}
                    </div>}
                </div>
                {plan.membership_status === "pending" ? <div className="planSection">
                    <p>{t("plans.replyInChat")}</p>
                </div> : plan.membership_status === "accepted" ? <>
                    <PlanReminders planId={plan.id} key={plan.id} planDate={plan.plan_date}
                        startTime={plan.start_time} timezone={plan.timezone}/>
                    <PlanMembers plan={plan} onChanged={async () => {
                        await Promise.all([load(), refreshPlans()]);
                    }}/>
                </> : null}
            </> : !error && <div className="planSection">{t("plans.notFound")}</div>}
        {isCompact && !editing && !loading && plan?.membership_status === "accepted" &&
            plan.status !== "canceled" && <div className="habitMobileDone planMobileDone">
                {canComplete && <div className={"doneButtDivMobile doable " + (mobileOpen === "done" ? "open" : "close")}>
                    {mobileOpen === "comment" ? <button type="button" className="bottomOpen"
                        aria-label={t("plans.completion")} onClick={() => setMobileOpen("done")}>
                        {plan.completed_for_me ? <CheckCircleIcon weight="fill" size={22}/> : <CircleIcon size={22}/>}
                    </button> : <button type="button" className="doneButtMobile" disabled={saving || !!pendingPlans[plan.id]}
                        onClick={() => void complete()}>
                        {plan.completed_for_me ? <CheckCircleIcon weight="fill" size={22}/> : <CircleIcon size={22}/>}
                        {t(plan.completed_for_me ? "plans.undoCompletion" : "habitUi.complete")}
                    </button>}
                </div>}
                <PlanComment planId={plan.id} disabled={plan.can_comment === false} mobile
                    open={canComplete ? mobileOpen : "comment"} setOpen={setMobileOpen}/>
            </div>
        }
    </div>;
}
