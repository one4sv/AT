import { Copy, Link } from "@phosphor-icons/react";
import { useGroup } from "../../hooks/GroupHook";
import { api } from "../../ts/api";
import { useNote } from "../../hooks/NoteHook";
import { useState } from "react";
import { formatDistanceToNow, isPast } from "date-fns";
import { ru } from "date-fns/locale";

export default function InviteUser() {
    const { group, refetchGroup } = useGroup();
    const { showNotification } = useNote();

    const API_URL = import.meta.env.VITE_API_URL;

    const [ loading, setLoading ] = useState<boolean>(false);
    const [ showCopied, setShowCopied ] = useState<boolean>(false);

    const linked = group.link;
    const expiresAt = group?.invite_expires_at ? new Date(group.invite_expires_at) : null;
    const isExpired = expiresAt && isPast(expiresAt);

    const linking = async() => {
        console.log("linking");
        if (linked && !isExpired) {
            navigator.clipboard.writeText(linked);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 1200);
            return
        } else {
            setLoading(true);
            try {
                const res = await api.post(`${API_URL}group/generate_link`, { group_id: group.id })
                if (res.data.success) {
                    navigator.clipboard.writeText(res.data.link);
                    setShowCopied(true);
                    setTimeout(() => setShowCopied(false), 1200)
                    await refetchGroup(group.id);
                }
                else {
                    console.log("error generating link");
                }
            } catch (error) {
                showNotification("error", "Не удалось сгенерировать ссылку");
                console.log("error generating link", error);
            }
            setLoading(false);
        }
    }

    const timeLeftText = expiresAt && !isExpired
        ? `Ссылка истекает ${formatDistanceToNow(expiresAt, { locale: ru, addSuffix: true })}`
        : isExpired
        ? "Ссылка истекла"
        : "";

    return (
        <div className="inviteUser">
            <label htmlFor="inviteUserLink">Ссылка приглашение</label>
            {showCopied && (
                <div className="copiedToast">
                    Скопировано
                </div>
            )}
            <div className="InviteUserWrapper" onClick={(e) => {
                e.preventDefault();
                linking()
            }}>
                <input type="text" className="inviteUserLink" name="" id="inviteUserLink" readOnly value={linked || ""} placeholder={loading ? "Генерируем..." :  "Нажмите чтобы создать ссылку"}/>
                <button>{linked ? <Copy/> : <Link/>}</button>
            </div>
            <span>{timeLeftText}</span>
        </div>
    )
}