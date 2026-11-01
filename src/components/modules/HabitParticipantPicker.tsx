import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, CheckCircleIcon, CircleIcon, UserCircleIcon } from "@phosphor-icons/react";
import { SearchIcon } from "lucide-react";
import RadioGroup from "../ts/RadioGroup";
import CreateChatInfo from "./components/CreateChatInfo";
import { useContacts } from "../hooks/ContactsHook";
import type { Contact } from "../context/ContactsContext";
import { useBlackout } from "../hooks/BlackoutHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import useHabitMembers from "../../pages/HabitPage/components/HabitInfo/useHabitMembers";

export default function HabitParticipantPicker() {
    const { blackout, setBlackout } = useBlackout();
    const { habit, loadHabit } = useTheHabit();
    const { findContacts } = useContacts();
    const { showNotification } = useNote();
    const { data } = useHabitMembers(habit?.id);
    const shared = blackout.point === "shared";
    const [ mode, setMode ] = useState(shared ? "group" : "activity");
    const [ search, setSearch ] = useState("");
    const [ list, setList ] = useState<Contact[]>([]);
    const [ selected, setSelected ] = useState<Contact[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ saving, setSaving ] = useState(false);
    const [ name, setName ] = useState(habit?.name || "");
    const [ desc, setDesc ] = useState("");
    const [ pick, setPick ] = useState<File | null>(null);
    const submitting = useRef(false);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        const timer = setTimeout(() => {
            findContacts(search, controller, mode === "group" ? "group" : "personal").then(contacts => {
                if (!controller.signal.aborted) setList((contacts || []).filter(contact => !data?.members.some(member => member.user_id === contact.id && member.status === "accepted")));
            }).catch(() => {
                if (!controller.signal.aborted) showNotification("error", "Не удалось загрузить контакты");
            }).finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        }, 150);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [search, mode, findContacts, data, showNotification]);
    const save = async () => {
        if (!habit || submitting.current) return;
        submitting.current = true;
        setSaving(true);
        try {
            if (mode === "activity") {
                if (!selected[0]) return;
                await api.post(`habits/${habit.id}/members`, { user_id: selected[0].id });
            } else {
                let chatId = mode === "group" ? Number(selected[0]?.id) : 0;
                if (mode === "add") {
                    const memberIds = [...new Set([...selected.map(item => item.id), ...(data?.members.filter(member => member.status === "accepted").map(member => member.user_id) || [])])];
                    const form = new FormData();
                    form.append("name", name.trim());
                    form.append("desc", desc.trim());
                    form.append("members", JSON.stringify(memberIds));
                    if (pick) form.append("pick", pick);
                    const created = await api.post("createchat", form);
                    if (!created.data.success) throw new Error();
                    chatId = Number(created.data.chat_id);
                }
                if (!Number.isSafeInteger(chatId) || chatId <= 0) return;
                await api.patch(`habits/${habit.id}/chat`, { chat_id: chatId });
            }
            await loadHabit(String(habit.id));
            window.dispatchEvent(new Event("habit-members-updated"));
            setBlackout({ seted: false });
            showNotification("success", mode === "activity" ? "Приглашение отправлено в чат" : "Активность связана с беседой");
        } catch {
            showNotification("error", "Не удалось сохранить участников. Проверьте права и выбор беседы.");
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };
    return <div className="habitCollaborationModal habitParticipantPicker" role="dialog" aria-modal="true" aria-label="Добавить участников">
        <div className="habitCollaborationHeader">Добавить участников</div>
        <div className="habitCollaborationBody">
            {shared ? <RadioGroup list={[{ label: "Добавить в существующую беседу", value: "group" }, { label: "Создать беседу", value: "add" }]} id="participantMode" val={mode} disabled={saving} newVal={value => { setMode(value); setSelected([]); }} /> : <div className="settingSpan">Пригласить в активность</div>}
            {mode === "add" && <CreateChatInfo name={name} setName={setName} desc={desc} setDesc={setDesc} pick={pick} setPick={setPick} />}
            {selected.map(contact => <button key={contact.id} type="button" className="contactsUser active" onClick={() => setSelected(current => current.filter(item => item.id !== contact.id))}>
                <div className="contactsUserPic">{contact.avatar_url ? <img className="contactsUserAvatar" src={contact.avatar_url} alt="" /> : <UserCircleIcon />}</div>
                <div className="contactsUserInfo"><div className="contactsUserStr"><span className="nameSpan">{contact.name || contact.nick}</span><CheckCircleIcon /></div></div>
            </button>)}
            <div className="createChatSearch"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск контактов" aria-label="Поиск контактов" /><SearchIcon /></div>
            <div className="habitPickerContacts">
                {loading ? <div className="habitMembersSkeleton" role="status" aria-label="Загрузка контактов"><div /><div /></div> : list.map(contact => <button key={contact.id} type="button" className="contactsUser" disabled={saving} onClick={() => setSelected(current => mode === "add" ? current.some(item => item.id === contact.id) ? current.filter(item => item.id !== contact.id) : [...current, contact] : [contact])}>
                    <div className="contactsUserPic">{contact.avatar_url ? <img className="contactsUserAvatar" src={contact.avatar_url} alt="" /> : <UserCircleIcon />}</div>
                    <div className="contactsUserInfo"><div className="contactsUserStr"><span className="nameSpan">{contact.name || contact.nick}</span>{selected.some(item => item.id === contact.id) ? <CheckCircleIcon weight="fill" /> : <CircleIcon />}</div></div>
                </button>)}
            </div>
        </div>
        <div className="habitConfirmActions">
            <button type="button" disabled={saving} onClick={() => setBlackout({ seted: false })} aria-label="Назад"><ArrowLeftIcon /></button>
            <button type="button" className="accept" disabled={saving || (mode !== "add" && !selected.length) || (mode === "add" && !name.trim()) || (shared && !data?.access.is_owner)} onClick={() => void save()}>{saving ? "Сохраняется…" : "Сохранить"}</button>
        </div>
    </div>;
}
