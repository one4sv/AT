import { Camera, CheckCircle, Circle, X } from '@phosphor-icons/react';
import '../../scss/modules/CreateChat.scss';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/ChatHook';
import { Search } from 'lucide-react';
import type { Acc } from '../context/ChatContext';
import { api } from '../ts/api';
import { useNote } from '../hooks/NoteHook';
import { LoaderSmall } from '../ts/LoaderSmall';
import { useBlackout } from '../hooks/BlackoutHook';

export default function CreateChat() {
    const { list, search, refetchContacts } = useChat()
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const API_URL = import.meta.env.VITE_API_URL;

    const [ name, setName ] = useState<string>("")
    const [ desc, setDesc ] = useState<string>("")
    const [ createChatSearch, setCreateChatSearch ] = useState<string>(search)
    const [ createChatList, setCreateChatList ] = useState<Acc[]>(list)
    const [ loadingList, setLoadingList ] = useState<boolean>(false);
    const [ chosenCons, setChosenCons ] = useState<Acc[]>([]);
    const [ pick, setPick ] = useState<File | null>(null);
    const [ loadingCreateChat, setLoadingCreateChat ] = useState<boolean>(false);

    const inputFileRef =  useRef<HTMLInputElement>(null);

    const refetchCreateChat = useCallback(async () => {
        setLoadingList(true);
        try {
            const res = await api.post(`${API_URL}contacts`, { search: createChatSearch });
            if (res.data.success) {
                const sortedList = res.data.friendsArr.slice().sort((a:Acc, b:Acc) => {
                    if (a.pinned !== b.pinned) {
                        return a.pinned ? -1 : 1; 
                    }

                    const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
                    const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;

                    return timeB - timeA;
                });
                setCreateChatList(sortedList);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            showNotification("error", error?.response?.data?.error);
        } finally {
            setLoadingList(false);
        }
    }, [API_URL, createChatSearch, showNotification]);

    useEffect(() => {
        const timer = setTimeout(refetchCreateChat, 100);
        return () => clearTimeout(timer);
    }, [createChatSearch, refetchCreateChat]);

    const createChat = async () => {
        setLoadingCreateChat(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("desc", desc);
        formData.append("members", JSON.stringify(chosenCons.map(con => con.id)));
        if (pick) {
            formData.append("pick", pick);
        }
        if (!name.trim()) {
            showNotification("error", "Введите название чата");
            return;
        }
        if (chosenCons.length < 1) {
            showNotification("error", "Выберите хотя бы одного участника");
            return;
        }
        try {
            const res = await api.post(`${API_URL}createchat`, formData);
            if (res.data.success) {
                showNotification("success", "Чат создан");
                setBlackout({ seted: false });
                refetchContacts();
            }
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
            <div className="createChatInfo">
                <div className="creteChatStr">
                    <input type="file" accept="image/*" hidden ref={inputFileRef} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPick(file);
                    }}/>
                    <div className="creteChatPickPre" onClick={() => inputFileRef.current?.click()}>
                        {pick ? (
                            <img src={URL.createObjectURL(pick)} className="createChatPick" alt="Chat Avatar Preview"/>
                        ) : <Camera />}
                    </div>
                    <div className="createChatWrapper">
                        <label htmlFor="createChatname">Название</label>
                        <input type="text" id="createChatname" className='createChatname' value={name} onChange={(e) => setName(e.target.value)} maxLength={40} minLength={3}/>
                        <span>{name.length}/40</span>
                    </div>
                </div>
                <div className="creteChatStr">
                    <div className="createChatWrapper">
                        <label htmlFor="createChatDesc">Описание</label>
                        <textarea id="createChatDesc" className='createChatDesc' value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={150}/>
                        <span>{desc.length}/150</span>
                    </div>
                </div>
            </div>
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
                            <span>{con.username || con.nick}</span>
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
                            <span>{con.username || con.nick}</span>
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
            <button className='createChatButt' disabled={chosenCons.length < 1 || name.trim() === ""} onClick={() => {
                if (chosenCons.length < 1 || name.trim() === "") return
                createChat()
            }}>
                {loadingCreateChat ? (
                    <LoaderSmall/>
                ) : (
                    "Создать"
                )}
            </button>
        </div>
    )
}