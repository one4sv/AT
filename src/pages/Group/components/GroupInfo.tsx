import { Camera, Users } from "lucide-react";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useEffect, useRef, useState} from "react";
import { useNavigate } from "react-router";
import type { Group } from "../../../components/context/GroupContext";
import { useGroup } from "../../../components/hooks/GroupHook";
import { useUser } from "../../../components/hooks/UserHook";
import { api } from "../../../components/ts/api";
import { useParams } from "react-router";
import { useNote } from "../../../components/hooks/NoteHook";
import { useChat } from "../../../components/hooks/ChatHook";

interface GroupInfoProps {
    group: Group | undefined,
}

export default function GroupInfo({group} : GroupInfoProps) {
    const { setBlackout } = useBlackout();
    const { user } = useUser()
    const { refetchGroup, members, newAva } = useGroup()
    const { showNotification } = useNote()
    const { refetchContactsWTLoading } = useChat()
    const navigate = useNavigate()
    const API_URL = import.meta.env.VITE_API_URL;
    const { id }  = useParams()

    const [ red, setRed ] = useState<boolean>(false);
    const [ previewUrl, setPreviewUrl ] = useState<string | null>(null);

    const [ newName, setNewName ] = useState<string>(group?.name || "");
    const [ newDesc, setNewDesc ] = useState<string>(group?.desc || "");
    const redactable = members.some(m => (m.role_name === "admin" || m.role_name === "owner") && m.id === user.id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (newAva instanceof File) {
            const url = URL.createObjectURL(newAva);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [newAva]);

    const handleSave = async() => {
        if (!user || !id) return;
        const updates: {row: string, value: string}[] = [];
        if (newName !== "" && newName !== group?.name) updates.push({row: "username", value: newName});
        if (newDesc !== group?.desc) updates.push({row: "desc", value: newDesc});
        if (newAva) {
            try {
                const fd = new FormData();
                fd.append("avatar", newAva);
                fd.append("group", id);
                const upRes = await api.post(`${API_URL}uploadavatar`, fd );
                if (upRes.data?.success) {
                    if (updates.length === 0) {
                        await refetchContactsWTLoading()
                        await refetchGroup(id)
                    }
                } else {
                    showNotification("error", upRes.data?.error || "Не удалось загрузить аватар");
                    return;
                }
            } catch {
                showNotification("error", "Не удалось загрузить аватар");
                return;
            }
        }

        if (updates.length > 0) {
            try {
                const res = await api.post(`${API_URL}updategroup`, {
                    group: id,        // ← добавляем ID группы
                    updates           // ← массив изменений
                });
                if (res.data.success) {
                    await refetchGroup(id);
                    await refetchContactsWTLoading(); // если нужно обновить список чатов
                    showNotification("success", "Данные обновлены");
                } else {
                showNotification("error", res.data.error || "Не удалось обновить данные");
                }
            } catch {
                showNotification("error", "Не удалось обновить данные");
            }
        }
        setRed(false);
    }

    return (
        <div className="groupInfo">
            <div className="groupInfoWrapper">
                <div
                    className="accPic"
                    onClick={() => redactable && red && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        className="accPicksfileInput"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files && setBlackout({ seted: true, module: "PickHandler", pick: e.target.files[0] })}
                    />
                    {previewUrl ? (
                        <img src={previewUrl} alt="avatar preview" className="avatarImg"/>
                    ) : group?.avatar_url && group.avatar_url !== null ? (
                        <img src={group.avatar_url} alt="avatar" className="avatarImg" onClick={() => {if (!red) setBlackout({seted:true, module:"ImgPrev", img:group.avatar_url ?? undefined})}}/>
                    ) : red ? (
                        <Camera size={256} />
                    ) : (
                        <Users size={128} />
                    )}
                </div>
                <div className="accInfoNames">
                    <div className="accMainInfoStr">
                        <input
                            className="accInput nameInput"
                            value={(redactable ? newName : group?.name) ?? ""}
                            readOnly={!red}
                            onChange={(e) => setNewName(e.currentTarget.value)}
                        />
                    </div>
                </div>
                <div className="groupButtsWrapper">
                    {redactable && (
                        <div className="groupInfoButt" onClick={() => {
                            if (red) {
                                handleSave()
                                setRed(false)
                            } else {
                                setRed(true)
                            }
                        }}>
                            {red ? "Сохранить" : "Редактировать"}
                        </div>   
                    )}
                    <div className="groupInfoButt" onClick={() => navigate(`/chat/g/${group?.id}`)}>
                        Написать сообщение
                    </div>
                </div>
            </div>
            <div className="accExtraInfoWrapper" style={{ display: group?.desc || red ? "flex" : "none" }}>
                <label htmlFor="bioTA">Описание</label>
                <textarea
                    className="bioTA extraInfoInput"
                    id="bioTA"
                    value={(redactable ? newDesc : group?.desc) ?? ""}
                    readOnly={!red}
                    onChange={(e) => setNewDesc(e.currentTarget.value)}
                ></textarea>
            </div>
        </div>
    )
}