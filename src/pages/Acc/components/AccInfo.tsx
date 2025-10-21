import { Camera, UserRound } from "lucide-react";
import { useUpUser } from "../../../components/hooks/UpdateUserHook";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { User } from "../../../components/context/UserContext";
import { useNavigate } from "react-router";

interface AccInfoProps {
    acc: User | undefined,
    red:boolean,
    setRed:Dispatch<SetStateAction<boolean>>,
    isMyAcc:boolean
}

export default function AccInfo({acc, red, setRed, isMyAcc} : AccInfoProps) {
    const { setBlackout } = useBlackout();
    const { newName, setNewName, newNick, setNewNick, handleSave, newPick } = useUpUser()
    const { onlineMap } = useChat();
    const navigate = useNavigate()
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (newPick instanceof File) {
            const url = URL.createObjectURL(newPick);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [newPick]);

    const accInfoButt = () => {
        if (isMyAcc) {
            if (red) handleSave();
            setRed(!red);
        } else {
            navigate(`/chat/${acc?.id}`);
        }
    };
    return (
        <div className="accInfo">
            <div
                className="accPic"
                onClick={() => isMyAcc && red && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    className="accPicksfileInput"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && setBlackout({ seted: true, module: "PickHandler", pick: e.target.files[0] })}
                />
                {previewUrl ? (
                    <img src={previewUrl} alt="avatar preview" className="avatarImg" onClick={() => setBlackout({seted:true, module:"ImgPrev", img:previewUrl})}/>
                ) : acc?.avatar_url ? (
                    <img src={acc.avatar_url} alt="avatar" className="avatarImg" onClick={() => setBlackout({seted:true, module:"ImgPrev", img:acc.avatar_url})}/>
                ) : red ? (
                    <Camera size={256} />
                ) : (
                    <UserRound size={128} />
                )}
            </div>
            <div className="accInfoNames">
                <div className="accMainInfoStr">
                    <input
                        className="accInput nameInput"
                        value={(isMyAcc ? newName : acc?.username) ?? ""}
                        readOnly={!red}
                        onChange={(e) => setNewName(e.currentTarget.value)}
                    />
                </div>
                <div>
                    @
                    <input
                        className="accInput nickInput"
                        value={(isMyAcc ? newNick : acc?.nick) ?? ""}
                        readOnly={!red}
                        onChange={(e) => setNewNick(e.currentTarget.value)}
                    />
                </div>
            </div>
            <div className="accInfoWrapper">
                <div className="accInfoRedButt" onClick={accInfoButt}>
                    {isMyAcc ? (red ? "Сохранить" : "Редактировать профиль") : "Написать сообщение"}
                </div>
                <div className={`accOnlineStauts ${onlineMap[acc?.id || ""] ? "online" : "offline"}`}>
                    {onlineMap[acc?.id || ""] 
                        ? "В сети" 
                        : formatLastOnline(acc?.last_online)}
                </div>
            </div>
        </div>
    )
}