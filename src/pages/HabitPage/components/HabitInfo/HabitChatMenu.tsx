import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import RadioGroup from "../../../../components/ts/RadioGroup";
import type { HabitSlideProps } from "../../HabitPage";
import { useNote } from "../../../../components/hooks/NoteHook";
import { useContacts } from "../../../../components/hooks/ContactsHook";
import { type ContactsFilter, type Contact } from "../../../../components/context/ContactsContext";
import CreateChatInfo from "../../../../components/modules/components/CreateChatInfo";
import { CameraIcon, CameraPlusIcon, CheckCircleIcon, CircleIcon, XIcon } from "@phosphor-icons/react";
import { CircleUserRound, SearchIcon } from "lucide-react";
import { LoaderSmall } from "../../../../components/ts/LoaderSmall";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import HabitMembers from "./HabitMembers";
import { Link } from "react-router-dom";
import { api } from "../../../../components/ts/api";

type ChatMenuOption = "group" | "add" | "activity";

export default function HabitChatMenu({ readOnly, isArchived, isMy }: HabitSlideProps) {
    const { findContacts } = useContacts()
    const { habit, loadHabitWLoading } = useTheHabit()
    const [ linkedChatId, setLinkedChatId ] = useState<number | null>(habit?.chat_id ?? null)
    const [ savingChat, setSavingChat ] = useState(false)
    useEffect(() => { setLinkedChatId(habit?.chat_id ?? null); }, [habit?.chat_id])
    const [ inviting, setInviting ] = useState(false)
    const { showNotification } = useNote()
    const [ selectedOption, setSelectedOption ] = useState<ChatMenuOption>("activity")
    const [ loadingList, setLoadingList ] = useState<boolean>(false);
    const [ chatList, setChatList ] = useState<Contact[]>([])
    const [ search, setSearch ] = useState("")
    const [name, setName] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [pick, setPick] = useState<File | null>(null);
    const [chosenCons, setChosenCons] = useState<Contact[]>([]);

    const abortRef = useRef<AbortController | null>(null);
    
    const listOption = [
        {label:"Пригласить в активность", value:"activity"},
        {label:"Добавить в беседу", value:"group"},
        {label:"Создать новую беседу", value:"add"},
    ]

    const updateChat = async (chatId: number | null) => {
        if (!habit || savingChat || !isMy) return;
        setSavingChat(true);
        try {
            const res = await api.patch(`habits/${habit.id}/chat`, { chat_id: chatId });
            if (!res.data.success) throw new Error("Link failed");
            setLinkedChatId(chatId);
            setChosenCons([]);
            await loadHabitWLoading(String(habit.id));
            showNotification("success", chatId ? "Активность привязана к беседе" : "Активность больше не привязана к беседе");
        } catch (error) {
            showNotification("error", axios.isAxiosError(error) ? error.response?.data?.error || "Ошибка изменения беседы" : "Ошибка изменения беседы");
        } finally {
            setSavingChat(false);
        }
    };

    const handleOptionChange = (val: string) => {
        setChosenCons([])
        if (val === "group" || val === "add" || val === "activity") {
            setSelectedOption(val);
        }
    };

    const refetchUsers = useCallback(async () => {
        setLoadingList(true);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const filter: ContactsFilter = selectedOption === "group"
                ? selectedOption
                : "personal"
                
            const sortedList = await findContacts(search, controller, filter);

            if (controller.signal.aborted || !sortedList) return;

            setChatList(sortedList);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
            showNotification("error", error?.response?.data?.error || "Ошибка загрузки");
        } finally {
            if (!controller.signal.aborted) {
                setLoadingList(false);
            }
        }
    }, [selectedOption, findContacts, search, showNotification]);

    useEffect(() => {
        const timer = setTimeout(refetchUsers, 100);
        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
    }, [refetchUsers]);
    
    return (
        <div className="habitInnerSlide">
            {habit && <div className="settingInnerWrapper">
                <div className="settingSpan">Совместная активность</div>
                <div className="settingHint">{linkedChatId ? "Активность привязана к беседе" : "Пока без привязки к беседе. Приглашённые участники получают отдельный прогресс выполнения."}</div>
                {linkedChatId && <Link to={`/chat/g/${linkedChatId}`} className="addGoalButtDiv">Открыть беседу</Link>}
                {linkedChatId && isMy && <button type="button" className="addGoalButtDiv" disabled={savingChat} onClick={() => void updateChat(null)}>Отвязать от беседы</button>}
                <HabitMembers habitId={habit.id} isOwner={!!isMy} showInvite={false}/>
            </div>}
            <div className="settingInnerWrapper">
                <div className="settingSpan">
                    Добавить участников
                </div>
                <RadioGroup list={listOption} val={selectedOption} newVal={handleOptionChange} disabled={!isMy || isArchived || readOnly} id=""/>
            </div>
            <span className="chatMenuSpan">
                {selectedOption === "group" && "Выберите беседу:"}
                {selectedOption === "add" && "Создать беседу:"}
                {selectedOption === "activity" && "Выберите контакт для приглашения в активность:"}
            </span>
            {selectedOption === "add" && (
                <CreateChatInfo
                    pick={pick}
                    setPick={setPick}
                    name={name}
                    setName={setName}
                    desc={desc}
                    setDesc={setDesc}
                />
            )}
            {selectedOption === "group" && chosenCons[0] && (
                <div className="contactsUser" onClick={() => setChosenCons([])}>
                    <div className="contactsUserPic">
                        {chosenCons[0].avatar_url ? (
                            <img
                                className="contactsUserAvatar"
                                src={chosenCons[0].avatar_url}
                                alt={chosenCons[0].name ?? chosenCons[0].nick}
                            />
                        ) : (
                            <CircleUserRound />
                        )}
                    </div>
                    <div className="contactsUserInfo">
                        <div className="contactsUserStr">
                            <span className="nameSpan">
                                {chosenCons[0].name ?? chosenCons[0].nick}
                            </span>
                            <XIcon />
                        </div>
                    </div>
                </div>
            )}
            {selectedOption === "group" && chosenCons[0] && <button type="button"
                className="addGoalButtDiv"
                disabled={savingChat || !isMy || readOnly || isArchived}
                onClick={() => {
                    const id = Number(chosenCons[0].id);
                    if (Number.isSafeInteger(id) && id > 0) void updateChat(id);
                }}
            >{savingChat ? "Сохраняем..." : linkedChatId ? "Перенести привязку в эту беседу" : "Привязать активность к беседе"}</button>}
            {selectedOption === "activity" && chosenCons[0] && <button
                type="button"
                className="addGoalButtDiv"
                disabled={inviting || !isMy || isArchived || readOnly}
                onClick={async () => {
                    if (!habit || !chosenCons[0] || inviting) return;
                    setInviting(true);
                    try {
                        await api.post(`habits/${habit.id}/members`, { user_id: String(chosenCons[0].id) });
                        showNotification("success", "Приглашение отправлено");
                        setChosenCons([]);
                        window.dispatchEvent(new Event("habit-members-updated"));
                    } catch (error) {
                        showNotification("error", axios.isAxiosError(error) ? error.response?.data?.error || "Не удалось пригласить пользователя" : "Не удалось пригласить пользователя");
                    } finally {
                        setInviting(false);
                    }
                }}
            >{inviting ? "Приглашаем..." : "Пригласить в активность"}</button>}
            <div className="habitChatList">
                <div className="createChatSearch">
                    <input
                        type="text"
                        name="searchList"
                        id="searchList"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <SearchIcon />
                </div>

                <div className="createChatChosenCons">
                    {selectedOption === "add" && chosenCons.length > 0 &&
                        chosenCons.map((con) => (
                            <div
                                key={con.id}
                                className="createChatChosenCon"
                                onClick={() => {
                                    setChosenCons((prev) =>
                                        prev.filter((acc) => acc.id !== con.id)
                                    );
                                }}
                            >
                                <div className="creteChatConPick">
                                    {con.avatar_url ? (
                                        <img src={con.avatar_url} />
                                    ) : (
                                        <CameraPlusIcon />
                                    )}
                                </div>
                                <span>{con.name || con.nick}</span>
                                <div className="createChatConRemove">
                                    <XIcon />
                                </div>
                            </div>
                        ))}
                </div>
                {loadingList ? (
                    <LoaderSmall />
                ) : (
                    chatList.length > 0 &&
                    chatList.map((con) => (
                        <div
                            key={con.id}
                            className="createChatContact"
                            onClick={() => {
                                if (selectedOption === "group" || selectedOption === "activity") setChosenCons([con])
                                else {
                                    setChosenCons((prev) =>
                                        prev.some((acc) => acc.id === con.id)
                                            ? prev.filter((acc) => acc.id !== con.id)
                                            : [...prev, con]
                                    );
                                }
                            }}
                        >
                            <div className="creteChatConPick">
                                {con.avatar_url ? (
                                    <img src={con.avatar_url} />
                                ) : (
                                    <CameraIcon />
                                )}
                            </div>
                            <span>{con.name || con.nick}</span>
                            <div className="createChatConCheck">
                                {chosenCons.some((acc) => acc.id === con.id) ? (
                                    <CheckCircleIcon weight="fill" />
                                ) : (
                                    <CircleIcon />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}