import { Camera, CheckCircle, Circle, X } from '@phosphor-icons/react';
import '../../scss/modules/CreateChat.scss';
import { useCallback, useEffect, useState } from 'react';
import { useChat } from '../hooks/ChatHook';
import { Search } from 'lucide-react';
import type { Contact } from '../context/ChatContext';
import { api } from '../ts/api';
import { useNote } from '../hooks/NoteHook';
import { LoaderSmall } from '../ts/LoaderSmall';
import { useBlackout } from '../hooks/BlackoutHook';
import CreateChatInfo from './components/CreateChatInfo';
import InviteUser from './components/InviteUser';
import { useGroup } from '../hooks/GroupHook';

export default function CreateChat() {
    const { search, refetchContacts } = useChat()
    const { setBlackout, blackout } = useBlackout();
    const { members, refetchGroup, group } = useGroup() 
    const { showNotification } = useNote();
    const API_URL = import.meta.env.VITE_API_URL;

    const [ name, setName ] = useState<string>("")
    const [ desc, setDesc ] = useState<string>("")
    const [ createChatList, setCreateChatList ] = useState<Contact[]>([])
    const [ createChatSearch, setCreateChatSearch ] = useState<string>(search)
    const [ loadingList, setLoadingList ] = useState<boolean>(false);
    const [ chosenCons, setChosenCons ] = useState<Contact[]>([]);
    const [ pick, setPick ] = useState<File | null>(null);
    const [ loadingCreateChat, setLoadingCreateChat ] = useState<boolean>(false);

    const refetchCreateChat = useCallback(async () => {
        setLoadingList(true);
        try {
            const res = await api.post(`${API_URL}contacts`, { search: createChatSearch });
            if (res.data.success) {
                const sortedList = res.data.friendsArr.slice().sort((a:Contact, b:Contact) => {
                    if (a.pinned !== b.pinned) {
                        return a.pinned ? -1 : 1; 
                    }

                    const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
                    const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;

                    return timeB - timeA;
                });
                let filteredList = sortedList.filter((con:Contact) => !con.is_group)
                if (blackout.point === "InviteUser") {
                    filteredList = filteredList.filter((con:Contact) => 
                        !members.some((member) => member.nick === con.nick)
                    );
                }
                setCreateChatList(filteredList);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            showNotification("error", error?.response?.data?.error);
        } finally {
            setLoadingList(false);
        }
    }, [API_URL, blackout.point, createChatSearch, members, showNotification]);

    useEffect(() => {
        const timer = setTimeout(refetchCreateChat, 100);
        return () => clearTimeout(timer);
    }, [createChatSearch, refetchCreateChat]);

    const createChat = async () => {
        setLoadingCreateChat(true);
        const formData = new FormData();
        let path = ""

        formData.append("members", JSON.stringify(chosenCons.map(con => con.id)));
        if (blackout.point === "InviteUser") {
            formData.append("group_id", group.id);
            path = "group/addusers"
        }  else {
            if (!name.trim()) {
                showNotification("error", "Введите название чата");
                return;
            }
            if (chosenCons.length < 1) {
                showNotification("error", "Выберите хотя бы одного участника");
                return;
            }
            formData.append("name", name);
            formData.append("desc", desc);
            if (pick) {
                formData.append("pick", pick);
            }
            path = "createchat"
        }
        try {
            const res = await api.post(`${API_URL}${path}`, formData);
                if (res.data.success) {
                    if (blackout.point === "InviteUser") {
                        await refetchGroup(group.id);
                    } else {
                        showNotification("success", "Чат создан");
                        setName("");
                        setDesc("");
                        setPick(null);
                    }
                }
            setBlackout({ seted: false });
            refetchContacts();
        } catch (error) {
            const err = error as { response?: { data?: { error?: string } } };
            showNotification("error", err?.response?.data?.error || "Не удалось создать чат");
        }
        finally {
            setLoadingCreateChat(false);
        }
    }
    
    return (
        <div className="createChatDiv">
            {blackout.point === "InviteUser" ? (
                <InviteUser />
            ) : (
                <CreateChatInfo pick={pick} setPick={setPick} name={name} setName={setName} desc={desc} setDesc={setDesc}/>
            )}
            
            <div className="createChatList">
                <div className="createChatSearch">
                    <input type="text" name="searchList" id="searchList" value={createChatSearch} onChange={(e) => setCreateChatSearch(e.target.value)}/>
                    <Search/>
                </div>
                <div className="createChatChosenCons">
                    {chosenCons.length > 0 && chosenCons.map((con) => (
                        <div key={con.id} className="createChatChosenCon" onClick={() => {
                                setChosenCons(prev => prev.filter(acc => acc.id !== con.id))
                            }}>
                            <div className="creteChatConPick">
                                {con.avatar_url ? (
                                    <img src={con.avatar_url}/>
                                ) : (
                                    <Camera />
                                )}
                            </div>
                            <span>{con.name || con.nick}</span>
                            <div className="createChatConRemove">
                                <X />
                            </div>
                        </div>
                    ))}
                </div>
                {loadingList ? (
                    <LoaderSmall />
                ) : (
                    createChatList.length > 0 && createChatList.map((con) => (
                        <div key={con.id} className="createChatContact" onClick={() => {
                            setChosenCons(prev =>
                                prev.some(acc => acc.id === con.id)
                                    ? prev.filter(acc => acc.id !== con.id)
                                    : [...prev, con]
                            );
                        }}>
                            <div className="creteChatConPick">
                                {con.avatar_url ? (
                                    <img src={con.avatar_url}/>
                                ) : (
                                    <Camera />
                                )}
                            </div>
                            <span>{con.name || con.nick}</span>
                            <div className="createChatConCheck">
                                {chosenCons.some(acc => acc.id === con.id) ? (
                                    <CheckCircle weight="fill" />
                                ) : (
                                    <Circle />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button className='createChatButt' disabled={chosenCons.length < 1 || (name.trim() === "" && blackout.point !== "InviteUser")} onClick={() => {
                if (chosenCons.length < 1 || (name.trim() === "" && blackout.point !== "InviteUser")) return
                createChat()
            }}>
                {loadingCreateChat ? (
                    <LoaderSmall/>
                ) : (
                    blackout.point === "InviteUser" ? "Подтвердить" : "Создать"
                )}
            </button>
        </div>
    )
}