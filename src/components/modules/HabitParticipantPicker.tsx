import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, CircleIcon, UserCircleIcon, XIcon } from "@phosphor-icons/react";
import { SearchIcon } from "lucide-react";
import RadioGroup from "../ts/RadioGroup";
import { useContacts } from "../hooks/ContactsHook";
import type { Contact } from "../context/ContactsContext";
import { useBlackout } from "../hooks/BlackoutHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import { useUser } from "../hooks/UserHook";
import axios from "axios";
import useHabitMembers from "../../pages/HabitPage/components/HabitInfo/useHabitMembers";

export default function HabitParticipantPicker() {
    const { blackout, setBlackout } = useBlackout();
    const { habit, loadHabit } = useTheHabit();
    const { findContacts } = useContacts();
    const findContactsRef = useRef(findContacts);
    findContactsRef.current = findContacts;
    const { user } = useUser();
    const { showNotification } = useNote();
    const { data } = useHabitMembers(habit?.id);
    const isOwner = habit?.user_id === user.id;
    const [ mode, setMode ] = useState(blackout.point === "shared" && isOwner ? "group" : "activity");
    const hasPartner = !!data?.members.some(member => member.user_id !== data.owner_id && (member.status === "accepted" || member.status === "pending"));
    const canDirectInvite = !hasPartner && !habit?.chat_id && !!data?.access.can_invite;
    const [ search, setSearch ] = useState("");
    const [ list, setList ] = useState<Contact[]>([]);
    const [ selected, setSelected ] = useState<Contact[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ listError, setListError ] = useState("");
    const [ saving, setSaving ] = useState(false);
    const submitting = useRef(false);
    const notifyRef = useRef(showNotification);
    notifyRef.current = showNotification;
    useEffect(() => {
        if (!canDirectInvite && isOwner) setMode("group");
    }, [canDirectInvite, isOwner]);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setListError("");
        const timer = setTimeout(() => {
            findContactsRef.current(search, controller, mode === "group" ? "group" : "personal").then(contacts => {
                if (controller.signal.aborted) return;
                if (!contacts) {
                    setListError("Не удалось загрузить контакты");
                    setList([]);
                    return;
                }
                setList(contacts.filter(contact =>
                    contact.id !== user.id &&
                    contact.name !== "Избранное" &&
                    !("is_favorite" in contact && contact.is_favorite) &&
                    !data?.members.some(member => member.user_id === contact.id && member.status === "accepted")
                ));
            }).catch(() => {
                if (!controller.signal.aborted) {
                    setListError("Не удалось загрузить контакты");
                    notifyRef.current("error", "Не удалось загрузить контакты");
                }
            }).finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        }, 150);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search, mode, data?.members, user.id]);
    const save = async () => {
        if (!habit || submitting.current || !selected.length || (mode === "activity" && !canDirectInvite) || (mode === "group" && !isOwner)) return;
        submitting.current = true;
        setSaving(true);
        try {
            if (mode === "activity") {
                await api.post(`habits/${habit.id}/members`, { user_id: selected[0].id });
            } else {
                const chatId = Number(selected[0].id);
                if (!Number.isSafeInteger(chatId) || chatId <= 0) throw new Error("Выберите беседу");
                const response = await api.patch(`habits/${habit.id}/chat`, { chat_id: chatId });
                if (response.data.invited_partner) {
                    showNotification("success", "Второму участнику отправлено приглашение в беседу");
                }
            }
            await loadHabit(String(habit.id));
            window.dispatchEvent(new Event("habit-members-updated"));
            setBlackout({ seted: false });
            showNotification("success", mode === "activity" ? "Приглашение отправлено в чат" : "Активность связана с беседой");
        } catch (error) {
            showNotification("error", axios.isAxiosError(error) ? error.response?.data?.error || "Не удалось сохранить участников" : "Не удалось сохранить участников. Проверьте права и выбор беседы.");
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };
    return <div className="habitCollaborationModal habitParticipantPicker" role="dialog" aria-modal="true" aria-label="Добавить участников">
        <div className="habitCollaborationHeader">Добавить участников</div>
        <div className="habitCollaborationBody">
            {isOwner ? <RadioGroup
                list={[
                    ...(canDirectInvite ? [{ label: "Пригласить в активность", value: "activity" }] : []),
                    { label: "Добавить в существующую беседу", value: "group" }
                ]}
                id="participantMode"
                val={mode}
                disabled={saving}
                newVal={value => { setMode(value); setSelected([]); }}
            /> : <div className="settingSpan">Пригласить в активность</div>}
            {isOwner && <button type="button" className="addGoalButtDiv habitPickerCreate" disabled={saving} onClick={() => setBlackout({ seted: true, module: "HabitCreateChat" })}>Создать новую беседу</button>}
            {selected.length > 0 && <div className="createChatChosenCons">
                {selected.map(contact => <button
                    key={contact.id}
                    type="button"
                    className="createChatChosenCon"
                    disabled={saving}
                    aria-label={`Убрать ${contact.name || contact.nick} из выбранных`}
                    onClick={() => setSelected(current => current.filter(item => item.id !== contact.id))}
                >
                    <div className="creteChatConPick">
                        {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : <UserCircleIcon />}
                    </div>
                    <span>{contact.name || contact.nick}</span>
                    <XIcon className="createChatConRemove" />
                </button>)}
            </div>}
            <div className="createChatSearch"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск контактов" aria-label="Поиск контактов" /><SearchIcon /></div>
            <div className="habitPickerContacts">
                {loading ? <div className="habitMembersSkeleton" role="status" aria-label="Загрузка контактов"><div /><div /></div> : listError ? <p role="alert">{listError}</p> : list.length === 0 ? <div className="habitSettingValue">Контакты не найдены</div> : list.map(contact => <button key={contact.id} type="button" className="contactsUser" disabled={saving} onClick={() => setSelected(current => [contact])}>
                    <div className="contactsUserPic">{contact.avatar_url ? <img className="contactsUserAvatar" src={contact.avatar_url} alt="" /> : <UserCircleIcon />}</div>
                    <div className="contactsUserInfo"><div className="contactsUserStr"><span className="nameSpan">{contact.name || contact.nick}</span>{selected.some(item => item.id === contact.id) ? <CheckCircleIcon weight="fill" /> : <CircleIcon />}</div></div>
                </button>)}
            </div>
        </div>
        <div className="habitConfirmActions">
            <button type="button" className="accept" disabled={saving || !selected.length || (mode === "activity" && !canDirectInvite) || (mode === "group" && !isOwner)} onClick={() => void save()}>{saving ? "Сохраняется…" : "Сохранить"}</button>
        </div>
    </div>;
}
